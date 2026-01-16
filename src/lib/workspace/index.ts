import { warn } from "$lib/log";
import { analysisBackground, workspaceArchiveDuplicateHandling } from "$lib/state";
import { record } from "$lib/task";
import { fetchProgress, groupBy, prettyMethodDesc, refFromName } from "$lib/utils";
import type { Member, Node } from "@katana-project/asm";
import type { UTF8Entry } from "@katana-project/asm/pool";
import type { Zip, Entry as ZipEntry } from "@katana-project/zip";
import { derived, get, writable } from "svelte/store";
import { AnalysisState, analyze, analyzeBackground, analyzeSchedule } from "./analysis";
import { transform } from "./analysis/transform";
import { type Data, fileData, memoryData, type Named, parseName, zipData } from "./data";
import { archiveDecoder } from "./encoding";

export const enum EntryType {
    FILE = "file",
    ARCHIVE = "archive",

    // post-analysis types
    CLASS = "class",
    MEMBER = "member",
    BINARY_XML = "binary_xml",
}

// reference to an entry, useful for sidestepping Svelte's reactivity
export interface EntryRef {
    name: string;
    get value(): Entry;
}

export const entryRef = (entry: Entry): EntryRef => ({
    name: entry.name,
    get value() {
        const entry = get(entries).get(this.name);
        if (!entry) {
            throw new Error(`Entry ${this.name} not found`);
        }

        return entry;
    },
});

export interface Entry extends Named {
    type: EntryType;
    parent?: Entry;
    data: Data;
    state: AnalysisState;
}

export interface ArchiveEntry extends Entry {
    type: EntryType.ARCHIVE;
    archive: Zip;
}

export enum EntryPointType {
    MAIN = "main",
    JAVA_AGENT = "java-agent",
    BUKKIT_PLUGIN = "bukkit-plugin",
    BUNGEE_PLUGIN = "bungee-plugin",
    VELOCITY_PLUGIN = "velocity-plugin",
    FORGE_MOD = "forge-mod",
    FABRIC_MOD = "fabric-mod",
    SPONGE_MIXIN = "sponge-mixin",
}

export const ENTRY_POINT_TYPES = Object.values(EntryPointType) as EntryPointType[];

export interface ClassEntry extends Entry {
    type: EntryType.CLASS | EntryType.MEMBER;
    node: Node;
    entryPoints?: EntryPointType[];
}

export interface MemberEntry extends ClassEntry {
    type: EntryType.MEMBER;
    member: Member;
}

export const readDeferred = async (entry: Entry): Promise<Entry> => {
    await analyze(entry, AnalysisState.FULL);

    // preprocess class file
    if (entry.type === EntryType.CLASS || entry.type === EntryType.MEMBER) {
        entry = await transform(entry as ClassEntry, await entry.data.bytes());
    }
    return entry;
};

const replaceExt = (path: string, ext: string): string => {
    const index = path.lastIndexOf(".");
    if (index !== -1) {
        path = path.substring(0, index);
    }

    return `${path}.${ext}`;
};

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

export const transformEntry = (entry: Entry, ext: string, value: string): Entry => {
    const name = replaceExt(entry.name, ext);

    return {
        type: EntryType.FILE,
        name,
        shortName: replaceExt(entry.shortName, ext),
        extension: ext,
        data: memoryData(name, utf8Encoder.encode(value), utf8Decoder),
        state: AnalysisState.NONE,
    };
};

export const memberEntry = (entry: ClassEntry, member: Member): MemberEntry => {
    const nodeName = (entry.node.pool[entry.node.thisClass.name] as UTF8Entry).string;

    const signature = member.name.string + prettyMethodDesc(member.type.string);

    const slashIndex = nodeName.lastIndexOf("/");
    return {
        ...entry,
        type: EntryType.MEMBER,
        parent: entry,
        name: `${entry.name}/${member.name.string}${member.type.string}`,
        shortName: `${slashIndex !== -1 ? nodeName.substring(slashIndex + 1) : nodeName}#${signature}`,
        data: {
            ...entry.data,
            name: signature,
        },
        member,
    };
};

export const entries = writable<Map<string, Entry>>(new Map());

// background analysis state updated, reanalyze
analysisBackground.subscribe(($analysisBackground) => {
    if ($analysisBackground) {
        analyzeSchedule(...Array.from(get(entries).values()));
        analyzeBackground().then();
    }
});

// ask user for confirmation if there are entries in the workspace
const unloadHandler = (e: BeforeUnloadEvent) => e.preventDefault();
entries.subscribe((e) => {
    window.onbeforeunload = e.size > 0 ? unloadHandler : null;
});

export const classes = derived(entries, ($entries) => {
    return new Map(
        Array.from($entries.values())
            .filter((e) => e.extension === "class")
            // use the data name, since we don't want the prepended nested archive path
            // this will be weird when you have conflicting classes across archives, but oh well
            .map((e) => [e.data.name.substring(0, e.data.name.indexOf(".class")), e])
    );
});

export const classRefs = derived(classes, ($classes) => Array.from($classes.keys()).map(refFromName));

export interface LoadResult {
    entry: Entry;
    created: boolean;
}

export const ZIP_EXTENSIONS = new Set(["zip", "jar", "apk", "xapk", "war", "ear", "jmod"]);

const readZip = async (blob: Blob): Promise<Zip> => {
    const { readBlob } = await import("@katana-project/zip");

    const zip = await readBlob(blob, { decoder: get(archiveDecoder) });
    const entries = groupBy(zip.entries, (e) => e.name);
    switch (get(workspaceArchiveDuplicateHandling)) {
        case "skip": {
            // skip duplicates with nonsensical sizes
            const toSkip = new Set<ZipEntry>();
            for (const duplicates of Array.from(entries.values())) {
                if (duplicates.length <= 1) {
                    continue;
                }

                duplicates
                    .filter((e) => e.compressedSize === 0 && e.compressedSize > blob.size)
                    .forEach((e) => toSkip.add(e));
            }

            zip.entries = zip.entries.filter((e) => !toSkip.has(e));
            break;
        }
        case "overwrite": {
            // keep only the last duplicate
            const toKeep = new Set<ZipEntry>();
            for (const duplicates of Array.from(entries.values())) {
                toKeep.add(duplicates[duplicates.length - 1]);
            }

            zip.entries = zip.entries.filter((e) => toKeep.has(e));
            break;
        }
        case "rename": {
            // rename duplicates
            for (const duplicates of Array.from(entries.values())) {
                if (duplicates.length <= 1) {
                    continue;
                }

                for (let i = 0; i < duplicates.length; i++) {
                    const e = duplicates[i];

                    const dotIndex = e.name.lastIndexOf(".");
                    if (dotIndex !== -1) {
                        e.name = `${e.name.substring(0, dotIndex)}_${i}${e.name.substring(dotIndex)}`;
                    } else {
                        e.name = `${e.name}_${i}`;
                    }
                }
            }
            break;
        }
    }

    return zip;
};

const load0 = async (entries: Map<string, Entry>, d: Data, parent?: Entry): Promise<LoadResult[]> => {
    const name = parent ? `${parent.name}/${d.name}` : d.name;

    const dupeEntry = entries.get(name);
    if (dupeEntry) {
        return [{ entry: dupeEntry, created: false }];
    }

    const results: LoadResult[] = [];

    let entry: Entry = {
        ...parseName(name),
        type: EntryType.FILE,
        parent,
        data: d,
        state: AnalysisState.NONE,
    };

    if (entry.extension && ZIP_EXTENSIONS.has(entry.extension)) {
        try {
            const archiveEntry = entry as ArchiveEntry;

            // if we're loading a nested archive, hope it's uncompressed or pretty small
            // if it isn't, then we're loading the entire thing into memory!
            archiveEntry.archive = await readZip(await d.blob());
            archiveEntry.state = AnalysisState.FULL;
            archiveEntry.type = EntryType.ARCHIVE;

            // expand archives into workspace
            for (const zipEntry of await zipData(archiveEntry.archive)) {
                results.push(...(await load0(entries, zipEntry, entry)));
            }
        } catch (e) {
            warn(`failed to read archive-like entry ${entry.name}`, e);
        }
    } else {
        analyzeSchedule(entry);
    }

    results.push({ entry, created: true });
    return results;
};

export const load = async (...d: Data[]): Promise<LoadResult[]> => {
    const entries0 = get(entries);
    const results = (await Promise.all(d.map((data) => load0(entries0, data)))).flat();

    const anyCreated = results.some((r) => r.created);
    if (anyCreated) {
        entries.update(($entries) => {
            for (const { entry, created } of results) {
                if (created) {
                    $entries.set(entry.name, entry);
                }
            }
            return $entries;
        });
    }

    analyzeBackground().then();
    return results;
};

export const loadFile = async (f: File): Promise<LoadResult[]> => {
    return load(fileData(f));
};

export const loadZip = async (f: File): Promise<LoadResult[]> => {
    return load(...(await zipData(await readZip(f))));
};

export const loadRemote = async (
    url: string,
    name: string | null = null,
    onProgress: (loaded: number, total: number) => void = () => {}
): Promise<LoadResult[]> => {
    const res = await fetchProgress(url, onProgress);
    if (!name) {
        name = new URL(url).pathname.split("/").pop() ?? null;
        if (!name?.includes(".")) {
            // no extension
            name = "input.jar";
        }
    }

    return load(memoryData(name, res));
};

export const remove = (name: string) => {
    entries.update(($entries) => {
        $entries.delete(name);
        return $entries;
    });
};

export const clear = () => {
    entries.update(($entries) => {
        $entries.clear();
        return $entries;
    });

    // force Svelte to dump derived store values?
    entries.update(($entries) => $entries);
};

// PWA file handler
// @ts-ignore - experimental APIs
if (window.launchQueue) {
    // @ts-ignore
    window.launchQueue.setConsumer((launchParams) => {
        if (launchParams.files) {
            for (const handle of launchParams.files) {
                if (handle.kind === "file") {
                    handle.getFile().then((f: File) => record("task.load", f.name, () => loadFile(f)));
                }
            }
        }
    });
}
