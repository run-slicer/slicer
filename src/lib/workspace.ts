import { derived, get, writable } from "svelte/store";
import { type Node, read } from "$lib/reader";
import { unzip, type ZipEntry, type ZipInfo } from "unzipit";

export interface BlobLike {
    stream: () => Promise<ReadableStream<Uint8Array>>;
    arrayBuffer: () => Promise<ArrayBuffer>;
    text: () => Promise<string>;
}

export type DataType = "file" | "zip";

export interface Data extends BlobLike {
    type: DataType;
    name: string;
}

export interface FileData extends Data {
    type: "file";
    file: File;
}

export const fileData = (file: File): FileData => {
    return {
        type: "file",
        name: file.name,
        file: file,
        stream: async () => file.stream(),
        arrayBuffer: () => file.arrayBuffer(),
        text: () => file.text(),
    };
};

export interface ZipData extends Data {
    type: "zip";
    parent: ZipInfo;
    entry: ZipEntry;
}

export const zipData = async (file: File): Promise<ZipData[]> => {
    const info = await unzip(file);

    return Object.entries(info.entries)
        .filter(([_, v]) => !v.isDirectory)
        .map(([n, v]) => {
            return {
                type: "zip",
                name: n,
                parent: info,
                entry: v,
                stream: async () => (await v.blob()).stream(),
                arrayBuffer: () => v.arrayBuffer(),
                text: () => v.text(),
            };
        });
};

export type EntryType = "class" | "file";

export interface Entry {
    type: EntryType;
    data: Data;
}

export interface ClassEntry extends Entry {
    type: "class";
    node: Node;
}

export const narrow = async (entry: Entry): Promise<Entry> => {
    if (entry.type !== "file") {
        return entry;
    }

    // try to specialize entry from a generic one
    const node = await read(await entry.data.stream());
    if (!node) {
        return entry;
    }

    return { ...entry, type: "class", node: node } as ClassEntry;
};

export const entries = writable<Map<string, Entry>>(new Map());

export const current = writable<Entry | null>(null);

export const classes = derived(entries, ($entries) => {
    return new Map(
        Array.from($entries.values())
            .filter((e) => e.data.name.endsWith(".class"))
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

export const load = async (d: Data): Promise<LoadResult> => {
    const dupeEntry = get(entries).get(d.name);
    if (dupeEntry) {
        return { entry: dupeEntry, created: false };
    }

    const entry: Entry = {
        type: "file",
        data: d,
    };

    entries.update((e) => {
        e.set(d.name, entry);
        return e;
    });

    return { entry: entry, created: true };
};

export const loadFile = async (f: File): Promise<LoadResult> => load(fileData(f));

export const loadZip = async (f: File): Promise<LoadResult[]> => Promise.all((await zipData(f)).map(load));

export const loadFileOrZip = async (f: File): Promise<LoadResult[]> => {
    const view = new DataView(await f.slice(0, 4).arrayBuffer());
    if (view.getInt32(0, true) === 0x04034b50) {
        return loadZip(f); // detected zip header
    }

    return [await loadFile(f)];
};
