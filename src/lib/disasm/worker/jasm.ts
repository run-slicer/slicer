import type { Worker, EntrySource } from "./";
import { expose } from "comlink";

expose({
    async run(name: string, _resources: string[], source: EntrySource): Promise<string> {
        const data = await source(name);
        if (!data) {
            return "";
        }

        const { disassemble } = await import("@run-slicer/jasm");
        return disassemble(data);
    },
} satisfies Worker);
