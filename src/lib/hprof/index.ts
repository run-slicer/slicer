import { wrap } from "comlink";
import type { SlurpResult } from "./reader";
import HPROFWorker from "./worker?worker";

export interface Worker {
    read(blob: Blob): Promise<SlurpResult>;
}

export const worker = wrap<Worker>(new HPROFWorker());
