import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { Worker } from "./";

expose({
    async class(
        name: string,
        _resources: string[],
        source: EntrySource,
        options?: Record<string, string>
    ): Promise<string> {
        const { decompile } = await import("@run-slicer/procyon");

        return decompile(name, { source, options });
    },
    method(
        _name: string,
        _signature: string,
        _source: EntrySource,
        _options?: Record<string, string>
    ): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies Worker);
