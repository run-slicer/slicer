import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { ClassWorker } from "./";

expose({
    async class(name: string, resources: string[], source: EntrySource): Promise<string> {
        const { decompile } = await import("@run-slicer/vf");

        return decompile(name, { resources, source });
    },
} satisfies ClassWorker);
