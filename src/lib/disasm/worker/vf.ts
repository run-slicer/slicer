import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { Options, Worker } from "./";

expose({
    async class(name: string, resources: string[], source: EntrySource, options?: Options): Promise<string> {
        const { decompile } = await import("@run-slicer/vf");

        return decompile(name, { resources, source, options });
    },
    method(_name: string, _signature: string, _source: EntrySource, _options?: Options): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies Worker);
