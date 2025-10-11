import { wrap } from "comlink";
import ReaderWorker from "./worker?worker";
import { roundRobin } from "$lib/utils";
import type { SlurpResult } from "$lib/reader/hprof";

export interface Worker {
    hprof(blob: Blob): Promise<SlurpResult>;
}

// maximum concurrency of 5
export const worker = roundRobin(5, () => wrap<Worker>(new ReaderWorker()));
