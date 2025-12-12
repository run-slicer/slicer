import { decompile } from "@run-slicer/vf";
import { expose } from "comlink";
import type { DisassemblerOptions } from "../";
import type { EntrySource } from "../source";
import type { DisassemblyWorker } from "./";

expose({
    async class(
        name: string,
        resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string> {
        return decompile(name, { resources, source, options });
    },
    method(): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies DisassemblyWorker);
