import { error } from "$lib/log";
import { analysisBackground } from "$lib/state";
import { recordProgress } from "$lib/task";
import { cancellable, type Cancellable, rateLimit } from "$lib/utils";
import { createDefaultWorkerPool } from "$lib/worker";
import {
    CharacteristicType,
    type ClassEntry,
    entries,
    type Entry,
    EntryPointType,
    EntryType,
    type MemberEntry,
} from "$lib/workspace";
import { FLAG_SKIP_ATTR_PARSE, FLAG_SLICE_BUFFER, type Node } from "@katana-project/asm";
import { type Annotation, type AnnotationsAttribute, readAnnotations } from "@katana-project/asm/attr/annotation";
import type { ClassEntry as ClassPoolEntry, RefEntry } from "@katana-project/asm/pool";
import { AttributeType, ConstantType, Modifier } from "@katana-project/asm/spec";
import { get } from "svelte/store";
import { QueryType, SearchMode, type SearchQuery, type SearchResult } from "./search";
import type { AnalysisWorker } from "./worker";
import Worker from "./worker?worker";

export const enum AnalysisState {
    NONE,
    PARTIAL,
    FULL,
}

const workers = createDefaultWorkerPool<AnalysisWorker>(() => new Worker());
const analyzeClass = async (entry: Entry, skipAttr: boolean) => {
    const buffer = await entry.data.bytes();

    try {
        const classEntry = entry as ClassEntry;

        classEntry.node = await workers
            .instance()
            .task((w) => w.read(buffer, skipAttr ? FLAG_SKIP_ATTR_PARSE | FLAG_SLICE_BUFFER : 0));
        if (entry.type === EntryType.MEMBER) {
            const memberEntry = entry as MemberEntry;

            // replace the member with a newly analyzed one
            const member = memberEntry.member;
            memberEntry.member =
                (member.type.string.charAt(0) === "(" ? memberEntry.node.methods : memberEntry.node.fields).find(
                    (m) => m.name.string === member.name.string && m.type.string === member.type.string
                ) || member;
        } else {
            classEntry.type = EntryType.CLASS;
            classEntry.entryPoints = analyzeEntryPoints(classEntry.node);
            classEntry.characteristics = analyzeCharacteristics(classEntry.node);
        }
    } catch (e) {
        error(`failed to read class ${entry.name}`, e);
    }
};

const FABRIC_INITIALIZERS = new Set([
    "net/fabricmc/api/ModInitializer",
    "net/fabricmc/api/ClientModInitializer",
    "net/fabricmc/api/DedicatedServerModInitializer",
]);

const analyzeEntryPoints = (node: Node): EntryPointType[] => {
    const entryPoints: EntryPointType[] = [];

    const mainMethod = node.methods.find(
        (m) =>
            m.name.string === "main" && m.type.string === "([Ljava/lang/String;)V" && (m.access & Modifier.STATIC) !== 0
    );

    if (mainMethod) {
        entryPoints.push(EntryPointType.MAIN);
    }

    let annotations: Annotation[] = [];
    try {
        const attr = node.attrs.find(
            (a) =>
                a.name?.string === AttributeType.RUNTIME_VISIBLE_ANNOTATIONS ||
                a.name?.string === AttributeType.RUNTIME_INVISIBLE_ANNOTATIONS
        ) as AnnotationsAttribute | undefined;

        if (attr) {
            annotations = attr.annotations ?? readAnnotations(attr, node.pool).annotations;
        }
    } catch {
        // annotations already defaults to []
    }

    const premainMethod = node.methods.find(
        (m) =>
            m.name.string === "premain" &&
            (m.type.string === "(Ljava/lang/String;Ljava/lang/instrument/Instrumentation;)V" ||
                m.type.string === "(Ljava/lang/String;)V") &&
            (m.access & Modifier.STATIC) !== 0
    );

    if (premainMethod) {
        entryPoints.push(EntryPointType.AGENT);
    }

    switch (node.superClass?.nameEntry?.string) {
        case "org/bukkit/plugin/java/JavaPlugin":
            entryPoints.push(EntryPointType.MINECRAFT_BUKKIT);
            break;
        case "net/md_5/bungee/api/plugin/Plugin":
            entryPoints.push(EntryPointType.MINECRAFT_BUNGEE);
            break;
    }

    const velocityPlugin = annotations.some((a) => a.typeEntry?.string === "Lcom/velocitypowered/api/plugin/Plugin;");
    if (velocityPlugin) {
        entryPoints.push(EntryPointType.MINECRAFT_VELOCITY);
    }

    const forgeMod = annotations.some((a) => a.typeEntry?.string === "Lnet/minecraftforge/fml/common/Mod;");
    if (forgeMod) {
        entryPoints.push(EntryPointType.MINECRAFT_FORGE);
    }

    const fabricMod = node.interfaces?.some((i) => i.nameEntry && FABRIC_INITIALIZERS.has(i.nameEntry.string));
    if (fabricMod) {
        entryPoints.push(EntryPointType.MINECRAFT_FABRIC);
    }

    return entryPoints;
};

const analyzeCharacteristics = (node: Node): CharacteristicType[] => {
    const chars = new Set<CharacteristicType>();
    for (const entry of node.pool) {
        switch (entry?.type) {
            case ConstantType.CLASS: {
                const className = (entry as ClassPoolEntry).nameEntry?.string;
                if (!className) break;

                switch (className) {
                    case "java/lang/ClassLoader":
                    case "java/net/URLClassLoader":
                        chars.add(CharacteristicType.CLASS_LOADING);
                        break;
                    case "javax/crypto/Cipher":
                        chars.add(CharacteristicType.ENCRYPTION);
                        break;
                    case "java/lang/reflect/Method":
                    case "java/lang/reflect/Constructor":
                    case "java/lang/reflect/Field":
                    case "java/lang/invoke/MethodHandle":
                    case "java/lang/invoke/MethodHandles":
                    case "java/lang/invoke/MethodHandles$Lookup":
                    case "java/lang/invoke/MethodType":
                    case "java/lang/invoke/VarHandle":
                    case "java/util/concurrent/atomic/AtomicReferenceFieldUpdater":
                    case "java/util/concurrent/atomic/AtomicIntegerFieldUpdater":
                    case "java/util/concurrent/atomic/AtomicLongFieldUpdater":
                        chars.add(CharacteristicType.REFLECTION);
                        break;
                    case "java/io/File":
                    case "java/nio/file/Files":
                    case "java/nio/file/Path":
                    case "java/nio/file/Paths":
                    case "java/nio/file/FileSystem":
                    case "java/nio/file/FileSystems":
                        chars.add(CharacteristicType.FILE_IO);
                        break;
                    case "java/net/Socket":
                    case "java/net/ServerSocket":
                    case "java/net/DatagramSocket":
                    case "java/net/HttpURLConnection":
                    case "java/net/URL":
                    case "java/net/URLConnection":
                    case "java/net/http/HttpClient":
                        chars.add(CharacteristicType.NETWORK_IO);
                        break;
                    case "java/io/ObjectInputStream":
                    case "java/io/ObjectOutputStream":
                        chars.add(CharacteristicType.OBJECT_SERDES);
                        break;
                    case "java/lang/foreign/MemorySegment":
                    case "java/lang/foreign/Arena":
                    case "java/lang/foreign/Linker":
                    case "java/lang/foreign/SymbolLookup":
                    case "sun/misc/Unsafe":
                        chars.add(CharacteristicType.NATIVE_CODE);
                        break;
                    case "java/lang/ProcessBuilder":
                    case "java/lang/ProcessHandle":
                    case "java/lang/Process":
                        chars.add(CharacteristicType.PROCESS_MANIPULATION);
                        break;
                }
                break;
            }
            case ConstantType.METHODREF:
            case ConstantType.INTERFACE_METHODREF: {
                const refEntry = entry as RefEntry;
                const className = refEntry.refEntry?.nameEntry?.string;
                const nameType = refEntry.nameTypeEntry;
                const methodName = nameType?.nameEntry?.string;

                if (!className || !methodName) break;

                if (className === "java/lang/Runtime" || className === "java/lang/System") {
                    if (methodName === "exec") {
                        chars.add(CharacteristicType.PROCESS_MANIPULATION);
                    }
                    if (methodName === "load" || methodName === "loadLibrary") {
                        chars.add(CharacteristicType.NATIVE_CODE);
                    }
                }

                break;
            }
        }
    }

    for (const method of node.methods) {
        if ((method.access & Modifier.NATIVE) !== 0) {
            chars.add(CharacteristicType.NATIVE_CODE);
        }
    }

    return Array.from(chars.values());
};

export const analyze = async (entry: Entry, state: AnalysisState = AnalysisState.PARTIAL) => {
    if (entry.state === AnalysisState.FULL) return;

    // full analysis does more expensive magic header detection
    // and reads class nodes in their entirety
    switch (state) {
        case AnalysisState.PARTIAL: {
            switch (entry.extension) {
                case "class":
                    await analyzeClass(entry, true);
                    break;
            }
            break;
        }
        case AnalysisState.FULL: {
            const blob = await entry.data.blob();
            const magic = new DataView(await blob.slice(0, Math.min(8, blob.size)).arrayBuffer());
            if (magic.byteLength >= 8) {
                if (entry.extension?.includes("xml") && magic.getUint16(0, true) === 0x0003 /* ChunkType.ResXml */) {
                    entry.type = EntryType.BINARY_XML;
                    break;
                }
            }
            if (magic.byteLength >= 4) {
                if (magic.getUint32(0, false) === 0xcafebabe) {
                    await analyzeClass(entry, false);
                    break;
                }
            }
            break;
        }
    }

    entry.state = state;
};

let queue: Entry[] = [];

export const analyzeSchedule = (...entries: Entry[]) => queue.push(...entries);

export const analyzeBackground = async () => {
    // snapshot queue
    const $queue = queue.filter((e) => e.state === AnalysisState.NONE);
    queue = [];

    if (!get(analysisBackground) || $queue.length === 0) return;

    await recordProgress("task.analyze", null, async (task) => {
        let completed = 0;
        await Promise.all(
            $queue.map(
                rateLimit(async (entry) => {
                    await analyze(entry);

                    completed++;
                    task.desc.set(`${completed}/${$queue.length}`);
                    task.progress?.set((completed / $queue.length) * 100);
                }, workers.size)
            )
        );

        task.desc.set(`${$queue.length}`);
    });

    // very hacky, but we need to trigger post-analysis updates to entries -> classes -> consumers
    entries.update(($entries) => $entries);
};

export { QueryType, SearchMode, type SearchQuery, type SearchResult };

export const search = (
    entries: Entry[],
    query: SearchQuery,
    onResult: (result: SearchResult) => void
): Cancellable<void> => {
    entries = entries.filter((e) => e.type === EntryType.CLASS);

    return cancellable((isCancelled) =>
        recordProgress("task.search", null, async (task) => {
            let completed = 0;
            await Promise.all(
                (entries as ClassEntry[]).map(
                    rateLimit(async (entry) => {
                        if (isCancelled()) {
                            return;
                        }

                        (await workers.instance().task((w) => w.search({ ...query, node: entry.node }))).forEach(
                            (res) => onResult({ ...res, entry })
                        );

                        completed++;
                        task.desc.set(`${completed}/${entries.length}`);
                        task.progress?.set((completed / entries.length) * 100);
                    }, workers.size)
                )
            );

            task.desc.set(`${completed}`);
        })
    );
};
