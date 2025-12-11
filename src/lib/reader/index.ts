import type { SlurpResult } from "$lib/reader/hprof";
import { createDefaultWorkerPool } from "$lib/worker";
import ReaderWorker from "./worker?worker";

export interface Reader {
    hex(bytes: Uint8Array, rowBytes: number): Promise<string>;
    axml(bytes: Uint8Array): Promise<string>;
    hprof(blob: Blob): Promise<SlurpResult>;
}

export const workers = createDefaultWorkerPool<Reader>(() => new ReaderWorker());
