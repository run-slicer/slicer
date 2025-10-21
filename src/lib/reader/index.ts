import type { SlurpResult } from "$lib/reader/hprof";
import { roundRobin } from "$lib/utils";
import { wrap } from "comlink";
import ReaderWorker from "./worker?worker";

export interface Worker {
    axml(bytes: Uint8Array): Promise<string>;
    hprof(blob: Blob): Promise<SlurpResult>;
}

// maximum concurrency of 5
export const worker = roundRobin(5, () => wrap<Worker>(new ReaderWorker()));
