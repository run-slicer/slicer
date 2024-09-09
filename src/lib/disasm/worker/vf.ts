import type { Worker, EntrySource } from "./";
import { expose } from "comlink";

expose({
    async run(name: string, resources: string[], source: EntrySource): Promise<string> {
        const { decompile } = await import("@run-slicer/vf");

        return decompile(name, { resources, source });
    },
} satisfies Worker);
