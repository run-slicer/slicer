import { decompile } from "@run-slicer/cfr";
import { expose } from "comlink";
import type { DisassemblerOptions } from "../";
import type { EntrySource } from "../source";
import type { Worker } from "./";

expose({
    async class(
        name: string,
        _resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string> {
        const output = await decompile(name, { source, options });

        // output postprocessing - remove header comment
        const start = output.indexOf("/*\n");
        const end = output.indexOf(" */\n");

        if (start >= 0 && end > start) {
            return output.substring(0, start) + output.substring(end + 4);
        }
        return output;
    },
    method(): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies Worker);
