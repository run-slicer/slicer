import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { Worker } from "./";

expose({
    async class(name: string, _resources: string[], source: EntrySource): Promise<string> {
        const { decompile } = await import("@run-slicer/procyon");

        return decompile(name, { source });
    },
    method(_name: string, _signature: string, _source: EntrySource): Promise<string> {
        throw new Error("Single-method disassembly not supported");
    },
} satisfies Worker);
