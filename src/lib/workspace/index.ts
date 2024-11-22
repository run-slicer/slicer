import { derived, get, writable } from "svelte/store";
import { type Node, read } from "@run-slicer/asm";
import type { Zip } from "@run-slicer/zip";
import { error, warn } from "$lib/log";
import { rootContext } from "$lib/script";
import { workspaceArchiveEncoding, workspaceArchiveNested } from "$lib/state";
import { type Data, type Named, transformData, parseName, fileData, zipData, memoryData } from "./data";

export const enum EntryType {
    FILE = "file",
    ARCHIVE = "archive",
    CLASS = "class", // only by readDetail
}

export interface Entry extends Named {
    type: EntryType;
    parent?: Entry;
    data: Data;
}

export interface ArchiveEntry extends Entry {
    type: EntryType.ARCHIVE;
    archive: Zip;
}

export interface ClassEntry extends Entry {
    type: EntryType.CLASS;
    node: Node;
}

export const readDetail = async (entry: Entry): Promise<Entry> => {
    if (entry.type !== EntryType.FILE) {
        return entry; // not a generic entry
    }

    const blob = await entry.data.blob();
    if (blob.size >= 4) {
        const view = new DataView(await blob.slice(0, 4).arrayBuffer());

        // detect magic
        if (view.getUint32(0, false) === 0xcafebabe) {
            // try to read as class
            const buffer = new Uint8Array(await blob.arrayBuffer());

            try {
                const event = await rootContext.dispatchEvent({
                    type: "preload",
                    name: entry.name,
                    data: buffer,
                });

                // create transformed data only if a transformation happened
                const data = event.data !== buffer ? transformData(entry.data, event.data) : entry.data;

                return {
                    ...entry,
                    type: EntryType.CLASS,
                    node: read(event.data),
                    data,
                } as ClassEntry;
            } catch (e) {
                error(`failed to read class ${entry.name}`, e);
            }
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

// UTF-8
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const transformEntry = (entry: Entry, ext: string, value: string): Entry => {
    const name = replaceExt(entry.name, ext);

    return {
        type: EntryType.FILE,
        name,
        shortName: replaceExt(entry.shortName, ext),
        extension: ext,
        data: memoryData(name, encoder.encode(value), decoder),
    };
};

export const entries = writable<Map<string, Entry>>(new Map());

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

    const entry: Entry = {
        ...parseName(name),
        type: EntryType.FILE,
        parent,
        data: d,
    };
    results.push({ entry, created: true });

    if (entry.extension && zipExtensions.has(entry.extension)) {
        const shouldExpandNested = get(workspaceArchiveNested);

        try {
            const archiveEntry = entry as ArchiveEntry;

            const { readBlob } = await import("@run-slicer/zip");

            // if we're loading a nested archive, hope it's uncompressed or pretty small
            // if it isn't, then we're loading the entire thing into memory!
            archiveEntry.archive = await readBlob(await d.blob(), { encoding: get(workspaceArchiveEncoding) });
            archiveEntry.type = EntryType.ARCHIVE;

            // read nested archives
            if (shouldExpandNested) {
                for (const zipEntry of await zipData(archiveEntry.archive)) {
                    results.push(...(await load0(entries, zipEntry, entry)));
                }
            }
        } catch (e) {
            warn(`failed to read archive-like entry ${entry.name}`, e);
        }
    }

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

    return results;
};

export const loadFile = async (f: File): Promise<LoadResult[]> => {
    return load(fileData(f));
};

export const loadZip = async (f: File): Promise<LoadResult[]> => {
    const { readBlob } = await import("@run-slicer/zip");

    return load(...(await zipData(await readBlob(f, { encoding: get(workspaceArchiveEncoding) }))));
};

export const remove = (entry: Entry) => {
    entries.update(($entries) => {
        $entries.delete(entry.name);
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
