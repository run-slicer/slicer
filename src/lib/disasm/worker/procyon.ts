import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { Options, Worker } from "./";

expose({
    async class(name: string, _resources: string[], source: EntrySource, options?: Options): Promise<string> {
        const { decompile } = await import("@run-slicer/procyon");

        return decompile(name, { source, options });
    },
    method(
        _name: string,
        _signature: string,
        _resources: string[],
        _source: EntrySource,
        _options?: Options
    ): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies Worker);
