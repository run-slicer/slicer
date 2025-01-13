import { roundRobin } from "$lib/utils";
import type { Decompressor } from "@run-slicer/zip";
import { wrap } from "comlink";
import CompressWorker from "./worker?worker";

export interface Worker {
    decompress(method: number, data: Uint8Array): Promise<Uint8Array>;
}

const worker = roundRobin(5, () => wrap<Worker>(new CompressWorker()));

export const decompressor: Decompressor = (method, data) => worker().decompress(method, data);
