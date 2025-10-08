import type { DisassemblyConfig } from "@run-slicer/jasm";
import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { Options, Worker } from "./";

const convertOpts = (options?: Options): DisassemblyConfig => ({
    indent: options?.indent,
});

expose({
    async class(name: string, _resources: string[], source: EntrySource, options?: Options): Promise<string> {
        const data = await source(name);
        if (!data) {
            throw new Error("Class not found");
        }

        const { disassemble } = await import("@run-slicer/jasm");
        return disassemble(data, convertOpts(options));
    },
    async method(
        name: string,
        signature: string,
        _resources: string[],
        source: EntrySource,
        options?: Options
    ): Promise<string> {
        const data = await source(name);
        if (!data) {
            throw new Error("Class not found");
        }

        const { disassemble } = await import("@run-slicer/jasm");
        return disassemble(data, { ...convertOpts(options), signature });
    },
} satisfies Worker);
