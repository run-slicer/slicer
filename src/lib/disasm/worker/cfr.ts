import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { ClassWorker } from "./";

expose({
    async class(name: string, _resources: string[], source: EntrySource): Promise<string> {
        const { decompile } = await import("@run-slicer/cfr");
        const output = await decompile(name, { source });

        // output postprocessing - remove header comment
        const start = output.indexOf("/*\n");
        const end = output.indexOf(" */\n");

        if (start >= 0 && end > start) {
            return output.substring(0, start) + output.substring(end + 4);
        }
        return output;
    },
} satisfies ClassWorker);
