import { derived, get, writable } from "svelte/store";
import { type Node, read } from "@run-slicer/asm";
import { type Zip, type Entry as ZipEntry, readBlob } from "@run-slicer/zip";
import { error, warn } from "$lib/logging";
import { rootContext } from "$lib/script";

export interface BlobLike {
    stream(): Promise<ReadableStream<Uint8Array>>;
    bytes(): Promise<Uint8Array>;
    text(): Promise<string>;
    blob(): Promise<Blob>;
}

export interface Named {
    name: string;
    shortName: string;
    extension?: string;
}

const parseName = (name: string): Named => {
    if (name.endsWith("/")) {
        // some obfuscators make non-directory ZIP entries with a trailing separator, remove it
        name = name.substring(0, name.length - 1);
    }

    let shortName = name;

    const slashIndex = name.lastIndexOf("/");
    if (slashIndex !== -1) {
        shortName = name.substring(slashIndex + 1);
    }

    let extension: string | undefined;

    const dotIndex = shortName.lastIndexOf(".");
    if (dotIndex !== -1) {
        extension = shortName.substring(dotIndex + 1).toLowerCase();
    }

    return { name, shortName, extension };
};

export const enum DataType {
    FILE,
    ZIP,
    MEMORY,
}

export interface Data extends BlobLike {
    type: DataType;
    name: string;
}

export interface FileData extends Data {
    type: DataType.FILE;
    file: File;
}

export const fileData = (file: File): FileData => {
    return {
        type: DataType.FILE,
        file: file,
        ...parseName(file.name),
        stream(): Promise<ReadableStream<Uint8Array>> {
            return Promise.resolve(file.stream());
        },
        async bytes(): Promise<Uint8Array> {
            return new Uint8Array(await file.arrayBuffer());
        },
        text(): Promise<string> {
            return file.text();
        },
        blob(): Promise<Blob> {
            return Promise.resolve(file);
        },
    };
};

export interface ZipData extends Data {
    type: DataType.ZIP;
    parent: Zip;
    entry: ZipEntry;
}

export const zipData = async (file: File): Promise<ZipData[]> => {
    const info = await readBlob(file);

    return info.entries
        .filter((v) => !v.isDirectory)
        .map((v) => {
            return {
                type: DataType.ZIP,
                parent: info,
                entry: v,
                ...parseName(v.name),
                async stream(): Promise<ReadableStream<Uint8Array>> {
                    return (await v.blob()).stream();
                },
                bytes(): Promise<Uint8Array> {
                    return v.bytes();
                },
                text(): Promise<string> {
                    return v.text();
                },
                blob(): Promise<Blob> {
                    return v.blob();
                },
            };
        });
};

export interface MemoryData extends Data {
    type: DataType.MEMORY;
    data: Uint8Array;
}

const decoder = new TextDecoder();
export const memoryData = (name: string, data: Uint8Array): MemoryData => {
    return {
        type: DataType.MEMORY,
        name,
        data,
        stream(): Promise<ReadableStream<Uint8Array>> {
            return Promise.resolve(
                new ReadableStream({
                    start(controller) {
                        controller.enqueue(data);
                        controller.close();
                    },
                })
            );
        },
        bytes(): Promise<Uint8Array> {
            return Promise.resolve(data);
        },
        text(): Promise<string> {
            return Promise.resolve(decoder.decode(data));
        },
        blob(): Promise<Blob> {
            return Promise.resolve(new Blob([data]));
        },
    };
};

export interface TransformData extends MemoryData {
    origin: Data;
}

export const transformData = (origin: Data, data: Uint8Array): TransformData => {
    return { ...memoryData(origin.name, data), origin };
};

export const unwrapTransform = (data: Data): Data => {
    return "origin" in data ? (data as TransformData).origin : data;
};

export const enum EntryType {
    FILE,
    ARCHIVE,
    CLASS, // only by readDetail
}

export interface Entry extends Named {
    type: EntryType;
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

    const buffer = await entry.data.bytes();

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    if (buffer.byteLength >= 4 && view.getUint32(0, false) === 0xcafebabe) {
        // try to read as class
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

    return entry;
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
            .map((e) => [e.name.substring(0, e.name.indexOf(".class")), e])
    );
});

export interface LoadResult {
    entry: Entry;
    created: boolean;
}

const zipExtensions = new Set(["zip", "jar", "war", "ear", "jmod"]);

const load0 = async (entries: Map<string, Entry>, d: Data): Promise<LoadResult> => {
    const dupeEntry = entries.get(d.name);
    if (dupeEntry) {
        return { entry: dupeEntry, created: false };
    }

    const entry: Entry = {
        ...parseName(d.name),
        type: EntryType.FILE,
        data: d,
    };
    if (entry.extension && zipExtensions.has(entry.extension)) {
        try {
            const archiveEntry = entry as ArchiveEntry;

            // if we're loading a nested archive, hope it's uncompressed or pretty small
            // if it isn't, then we're loading the entire thing into memory!
            archiveEntry.archive = await readBlob(await d.blob());
            archiveEntry.type = EntryType.ARCHIVE;
        } catch (e) {
            warn(`failed to read archive-like entry ${entry.name}`, e);
        }
    }

    return { entry, created: true };
};

export const load = async (d: Data): Promise<LoadResult> => {
    const result = await load0(get(entries), d);
    if (result.created) {
        entries.update(($entries) => {
            $entries.set(result.entry.name, result.entry);
            return $entries;
        });
    }

    return result;
};

export const loadBatch = async (d: Data[]): Promise<LoadResult[]> => {
    const entries0 = get(entries);

    const results = await Promise.all(d.map((data) => load0(entries0, data)));
    entries.update(($entries) => {
        for (const { entry, created } of results) {
            if (created) {
                $entries.set(entry.name, entry);
            }
        }
        return $entries;
    });

    return results;
};

export const loadFile = async (f: File): Promise<LoadResult[]> => {
    const view = new DataView(await f.slice(0, 4).arrayBuffer());

    // TODO: ZIPs can have bogus data at the beginning, failing this check
    if (view.byteLength >= 4 && view.getInt32(0, true) === 0x04034b50) {
        return loadBatch(await zipData(f)); // detected zip header
    }

    return [await load(fileData(f))];
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
