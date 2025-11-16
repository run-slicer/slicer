import type { EntrySource } from "$lib/disasm/source";
import { read } from "@katana-project/asm";
import { disassemble, disassembleMethod, type DisassemblyOptions } from "@katana-project/asm/analysis/disasm";
import { expose } from "comlink";
import type { DisassemblerOptions } from "../";
import type { Worker } from "./";

const convertOpts = (options?: DisassemblerOptions): DisassemblyOptions => ({
    indent: options?.indent ?? " ".repeat(4),
    fullyQualified: (options?.fullyQualified ?? "true") === "true",
    verbose: (options?.verbose ?? "true") === "true",
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

        return disassemble(read(data), convertOpts(options));
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

        const node = read(data);
        const method = node.methods.find((m) => signature === `${m.name.string}${m.type.string}`);
        if (!method) {
            throw new Error("Method not found");
        }

        return disassembleMethod(node, method, convertOpts(options));
    },
} satisfies Worker);
