import type { SlurpResult } from "$lib/reader/hprof";
import { roundRobin } from "$lib/utils";
import { wrap } from "comlink";
import ReaderWorker from "./worker?worker";

export interface Worker {
    axml(bytes: Uint8Array): Promise<string>;
    hprof(blob: Blob): Promise<SlurpResult>;
}

const MAX_CONCURRENT = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));

export const worker = roundRobin(MAX_CONCURRENT, () => wrap<Worker>(new ReaderWorker()));
