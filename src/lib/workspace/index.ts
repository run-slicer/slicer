import { warn } from "$lib/log";
import { rootContext } from "$lib/script";
import { analysisBackground } from "$lib/state";
import { prettyMethodDesc } from "$lib/utils";
import type { Member, Node } from "@run-slicer/asm";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import type { Zip } from "@run-slicer/zip";
import { derived, get, writable } from "svelte/store";
import { AnalysisState, analyze, analyzeBackground, analyzeSchedule } from "./analysis";
import { type Data, fileData, memoryData, type Named, parseName, transformData, zipData } from "./data";
import { archiveDecoder } from "./encoding";

export const enum EntryType {
    FILE = "file",
    ARCHIVE = "archive",
    CLASS = "class",
    MEMBER = "member",
}

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

export interface ClassEntry extends Entry {
    type: EntryType.CLASS | EntryType.MEMBER;
    node: Node;
}

export interface MemberEntry extends ClassEntry {
    type: EntryType.MEMBER;
    member: Member;
}

export const readDeferred = async (entry: Entry): Promise<Entry> => {
    await analyze(entry, AnalysisState.FULL);

    // preprocess class file with script
    if (entry.type === EntryType.CLASS) {
        const buffer = await entry.data.bytes();
        const event = await rootContext.dispatchEvent({
            type: "preload",
            name: entry.name,
            data: buffer,
        });

        // create transformed entry only if a transformation happened
        if (event.data !== buffer) {
            entry = { ...entry, data: transformData(entry.data, event.data), state: AnalysisState.NONE };

            await analyze(entry, AnalysisState.FULL);
        }
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
        for (const entry of get(entries).values()) {
            analyzeSchedule(entry);
        }

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

export interface LoadResult {
    entry: Entry;
    created: boolean;
}

const zipExtensions = new Set(["zip", "jar", "war", "ear", "jmod"]);

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

    if (entry.extension && zipExtensions.has(entry.extension)) {
        try {
            const archiveEntry = entry as ArchiveEntry;

            const { readBlob } = await import("@run-slicer/zip");

            // if we're loading a nested archive, hope it's uncompressed or pretty small
            // if it isn't, then we're loading the entire thing into memory!
            archiveEntry.archive = await readBlob(await d.blob(), { decoder: get(archiveDecoder) });
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
    const { readBlob } = await import("@run-slicer/zip");

    return load(...(await zipData(await readBlob(f, { decoder: get(archiveDecoder) }))));
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
};

// PWA file handler
// @ts-ignore - experimental APIs
if (window.launchQueue) {
    // @ts-ignore
    window.launchQueue.setConsumer((launchParams) => {
        if (launchParams.files) {
            for (const handle of launchParams.files) {
                if (handle.kind === "file") {
                    handle.getFile().then(loadFile);
                }
            }
        }
    });
}
