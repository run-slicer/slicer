import { expose } from "comlink";
import type { EntrySource, Worker } from "./";

expose({
    async run(name: string, _resources: string[], source: EntrySource): Promise<string> {
        const { decompile } = await import("@run-slicer/procyon");

        return decompile(name, { source });
    },
} satisfies Worker);
