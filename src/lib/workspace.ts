import { derived, get, writable } from "svelte/store";
import { type Node, read } from "@run-slicer/asm";
import { unzip, type ZipEntry, type ZipInfo } from "unzipit";
import { error } from "$lib/logging";
import { rootContext } from "$lib/script";

export interface BlobLike {
    stream(): Promise<ReadableStream<Uint8Array>>;
    arrayBuffer(): Promise<ArrayBuffer>;
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
        extension = shortName.substring(dotIndex + 1);
    }

    return { name, shortName, extension };
};

export const enum DataType {
    FILE,
    ZIP,
    MEMORY,
}

export interface Data extends BlobLike, Named {
    type: DataType;
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
        arrayBuffer(): Promise<ArrayBuffer> {
            return file.arrayBuffer();
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
    parent: ZipInfo;
    entry: ZipEntry;
}

export const zipData = async (file: File): Promise<ZipData[]> => {
    const info = await unzip(file);

    return Object.entries(info.entries)
        .filter(([_, v]) => !v.isDirectory)
        .map(([n, v]) => {
            return {
                type: DataType.ZIP,
                parent: info,
                entry: v,
                ...parseName(n),
                async stream(): Promise<ReadableStream<Uint8Array>> {
                    return (await v.blob()).stream();
                },
                arrayBuffer(): Promise<ArrayBuffer> {
                    return v.arrayBuffer();
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
export const memoryData = (name: Named, data: Uint8Array): MemoryData => {
    return {
        ...name,
        type: DataType.MEMORY,
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
        arrayBuffer(): Promise<ArrayBuffer> {
            return Promise.resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
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
    return {
        ...origin,
        type: DataType.MEMORY,
        data,
        origin,
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
        arrayBuffer(): Promise<ArrayBuffer> {
            return Promise.resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
        },
        text(): Promise<string> {
            return Promise.resolve(decoder.decode(data));
        },
        blob(): Promise<Blob> {
            return Promise.resolve(new Blob([data]));
        },
    };
};

export const unwrapTransform = (data: Data): Data => {
    return "origin" in data ? (data as TransformData).origin : data;
};

export const enum EntryType {
    FILE,
    CLASS,
}

export interface Entry {
    type: EntryType;
    data: Data;
}

export interface ClassEntry extends Entry {
    type: EntryType.CLASS;
    node: Node;
}

export const readDetail = async (entry: Entry): Promise<Entry> => {
    if (entry.type !== EntryType.FILE) {
        return entry; // not a generic entry
    }

    const buffer = await entry.data.arrayBuffer();

    const view = new DataView(buffer.slice(0, 4));
    if (view.byteLength >= 4 && view.getUint32(0, false) === 0xcafebabe) {
        // try to read as class
        try {
            const buf = new Uint8Array(buffer);
            const event = await rootContext.dispatchEvent({
                type: "preload",
                name: entry.data.name,
                data: buf,
            });

            // create transformed data only if a transformation happened
            const data = event.data !== buf ? transformData(entry.data, event.data) : entry.data;

            return {
                ...entry,
                type: EntryType.CLASS,
                node: read(event.data),
                data,
            } as ClassEntry;
        } catch (e) {
            error(`failed to read class ${entry.data.name}`, e);
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
            .filter((e) => e.data.extension === "class")
            .map((e) => {
                const name = e.data.name;

                return [name.substring(0, name.indexOf(".class")), e];
            })
    );
});

export interface LoadResult {
    entry: Entry;
    created: boolean;
}

const load0 = async (entries: Map<string, Entry>, d: Data): Promise<LoadResult> => {
    const dupeEntry = entries.get(d.name);
    if (dupeEntry) {
        return { entry: dupeEntry, created: false };
    }

    const entry: Entry = {
        type: EntryType.FILE,
        data: d,
    };

    return { entry: entry, created: true };
};

export const load = async (d: Data): Promise<LoadResult> => {
    const result = await load0(get(entries), d);
    if (result.created) {
        entries.update(($entries) => {
            $entries.set(d.name, result.entry);
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
                $entries.set(entry.data.name, entry);
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
        $entries.delete(entry.data.name);
        return $entries;
    });
};

export const clear = () => {
    entries.update(($entries) => {
        $entries.clear();
        return $entries;
    });
};
