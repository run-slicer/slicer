import { derived, get, writable } from "svelte/store";
import { type Node, read } from "@run-slicer/asm";
import { unzip, type ZipEntry, type ZipInfo } from "unzipit";
import { error } from "$lib/logging";

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

export type DataType = "file" | "zip";

export interface Data extends BlobLike, Named {
    type: DataType;
}

export interface FileData extends Data {
    type: "file";
    file: File;
}

export const fileData = (file: File): FileData => {
    return {
        type: "file",
        file: file,
        stream: async () => file.stream(),
        arrayBuffer: () => file.arrayBuffer(),
        text: () => file.text(),
        blob: async () => file,
        ...parseName(file.name),
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
                parent: info,
                entry: v,
                stream: async () => (await v.blob()).stream(),
                arrayBuffer: () => v.arrayBuffer(),
                text: () => v.text(),
                blob: () => v.blob(),
                ...parseName(n),
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

export const readDetail = async (entry: Entry): Promise<Entry> => {
    if (entry.type !== "file") {
        return entry; // not a generic entry
    }

    const buffer = await entry.data.arrayBuffer();

    const view = new DataView(buffer.slice(0, 4));
    if (view.byteLength >= 4 && view.getUint32(0, false) === 0xcafebabe) {
        // try to read as class
        try {
            const node = read(new Uint8Array(buffer));

            return { ...entry, type: "class", node: node } as ClassEntry;
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

export const current = writable<Entry | null>(null);

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
        type: "file",
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
    if (get(current)?.data?.name === entry.data.name) {
        current.set(null); // opened, close it before removing
    }

    entries.update(($entries) => {
        $entries.delete(entry.data.name);
        return $entries;
    });
};

export const clear = () => {
    current.set(null); // close opened entry
    entries.update(($entries) => {
        $entries.clear();
        return $entries;
    });
};
