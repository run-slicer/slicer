import { expose } from "comlink";
import type { EntrySource } from "../source";
import type { Worker } from "./";

expose({
    async class(
        name: string,
        _resources: string[],
        source: EntrySource,
        _options?: Record<string, string>
    ): Promise<string> {
        const data = await source(name);
        if (!data) {
            return "";
        }

        const { disassemble } = await import("@run-slicer/jasm");
        return disassemble(data);
    },
    async method(
        name: string,
        signature: string,
        source: EntrySource,
        _options?: Record<string, string>
    ): Promise<string> {
        const data = await source(name);
        if (!data) {
            return "";
        }

        const { disassemble } = await import("@run-slicer/jasm");
        return disassemble(data, { signature });
    },
} satisfies Worker);
