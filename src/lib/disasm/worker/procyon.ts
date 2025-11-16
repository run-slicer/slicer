import { decompile } from "@run-slicer/procyon";
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
        return decompile(name, { source, options });
    },
    method(): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies Worker);
