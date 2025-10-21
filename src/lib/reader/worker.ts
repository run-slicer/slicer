import { expose } from "comlink";
import type { Worker } from "./";
import { read as axml } from "./axml";
import { read as hprof } from "./hprof";

expose({
    hprof,
    async axml(bytes: Uint8Array): Promise<string> {
        return axml(bytes);
    },
} satisfies Worker);
