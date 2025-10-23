import { escapeNonPrintable, uniqueBy } from "$lib/utils";
import type { Entry, Zip } from "@katana-project/zip";
import { get } from "svelte/store";
import { decoder } from "./encoding";

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

export const parseName = (name: string): Named => {
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
        name: file.name,
        file: file,
        stream(): Promise<ReadableStream<Uint8Array>> {
            return Promise.resolve(file.stream());
        },
        async bytes(): Promise<Uint8Array> {
            return new Uint8Array(await file.arrayBuffer());
        },
        async text(): Promise<string> {
            return get(decoder).decode(await this.bytes());
        },
        blob(): Promise<Blob> {
            return Promise.resolve(file);
        },
    };
};

export interface ZipData extends Data {
    type: DataType.ZIP;
    parent: Zip;
    entry: Entry;
}

export const zipData = async (zip: Zip): Promise<ZipData[]> => {
    return uniqueBy(
        zip.entries
            .filter((v) => !v.isDirectory)
            .map((v) => {
                return {
                    type: DataType.ZIP,
                    name: escapeNonPrintable(v.fileName || v.name),
                    parent: zip,
                    entry: v,
                    async stream(): Promise<ReadableStream<Uint8Array>> {
                        return (await v.blob()).stream();
                    },
                    bytes(): Promise<Uint8Array> {
                        return v.bytes();
                    },
                    async text(): Promise<string> {
                        return get(decoder).decode(await this.bytes());
                    },
                    blob(): Promise<Blob> {
                        return v.blob();
                    },
                };
            }),
        (e) => e.name
    );
};

export interface MemoryData extends Data {
    type: DataType.MEMORY;
    data: Uint8Array | Blob;
}

export const memoryData = (
    name: string,
    data: Blob | Uint8Array,
    dataDecoder: TextDecoder = get(decoder)
): MemoryData => {
    return {
        type: DataType.MEMORY,
        name,
        data,
        async stream(): Promise<ReadableStream<Uint8Array>> {
            if (data instanceof Blob) {
                return data.stream();
            }

            return new ReadableStream({
                start(controller) {
                    controller.enqueue(data);
                    controller.close();
                },
            });
        },
        async bytes(): Promise<Uint8Array> {
            return data instanceof Blob ? data.bytes() : data;
        },
        async text(): Promise<string> {
            return dataDecoder.decode(await this.bytes());
        },
        async blob(): Promise<Blob> {
            return data instanceof Blob ? data : new Blob([data as Uint8Array<ArrayBuffer>]);
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

export const download = async (
    data: Iterable<Data> | AsyncIterable<Data>,
    onFailure?: (data: Data, error: any) => void
): Promise<Blob> => {
    const { downloadZip } = await import("client-zip");

    return downloadZip(
        (async function* () {
            for await (const item of data) {
                try {
                    yield { name: item.name, input: await item.blob() };
                } catch (e) {
                    onFailure?.(item, e);
                }
            }
        })()
    ).blob();
};
