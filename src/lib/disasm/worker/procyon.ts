import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { ClassWorker } from "./";

expose({
    async class(name: string, _resources: string[], source: EntrySource): Promise<string> {
        const { decompile } = await import("@run-slicer/procyon");

        return decompile(name, { source });
    },
} satisfies ClassWorker);
