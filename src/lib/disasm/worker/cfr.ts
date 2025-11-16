import { decompile } from "@run-slicer/cfr";
import { expose } from "comlink";
import type { DisassemblerOptions } from "../";
import type { EntrySource } from "../source";
import type { Worker } from "./";

const removeHeader = (output: string): string => {
    const start = output.indexOf("/*\n");
    const end = output.indexOf(" */\n");

    return start >= 0 && end > start ? output.substring(0, start) + output.substring(end + 4) : output;
};

expose({
    async class(
        name: string,
        _resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string> {
        return removeHeader(await decompile(name, { source, options }));
    },
    async method(
        name: string,
        signature: string,
        _resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string> {
        options = options ?? {};
        options.methodname = signature.substring(0, signature.indexOf("("));

        return removeHeader(await decompile(name, { source, options }));
    },
} satisfies Worker);
