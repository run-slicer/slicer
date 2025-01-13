import { streamDecompressor } from "@run-slicer/zip";
import { expose } from "comlink";
import type { Worker } from "./";

expose({
    async decompress(method: number, data: Uint8Array): Promise<Uint8Array> {
        return streamDecompressor(method, data);
    },
} satisfies Worker);
