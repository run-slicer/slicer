import { disassemble, type DisassemblyConfig } from "@run-slicer/jasm";
import { expose } from "comlink";
import type { DisassemblerOptions } from "../";
import type { EntrySource } from "../source";
import type { Worker } from "./";

const convertOpts = (options?: DisassemblerOptions): DisassemblyConfig => ({
    indent: options?.indent,
});

expose({
    async class(
        name: string,
        _resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string> {
        const data = await source(name);
        if (!data) {
            throw new Error("Class not found");
        }

        return disassemble(data, convertOpts(options));
    },
    async method(
        name: string,
        signature: string,
        _resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string> {
        const data = await source(name);
        if (!data) {
            throw new Error("Class not found");
        }

        return disassemble(data, { ...convertOpts(options), signature });
    },
} satisfies Worker);
