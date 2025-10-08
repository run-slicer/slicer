import type { EntrySource } from "$lib/disasm/source";
import type { DisassemblyOptions } from "@katana-project/asm/analysis/disasm";
import { expose } from "comlink";
import type { Options, Worker } from "./";

const convertOpts = (options?: Options): DisassemblyOptions => ({
    indent: options?.indent ?? " ".repeat(4),
    fullyQualified: (options?.fullyQualified ?? "true") === "true",
    verbose: (options?.verbose ?? "true") === "true",
});

expose({
    async class(name: string, _resources: string[], source: EntrySource, options?: Options): Promise<string> {
        const data = await source(name);
        if (!data) {
            throw new Error("Class not found");
        }

        const { read } = await import("@katana-project/asm");

        const { disassemble } = await import("@katana-project/asm/analysis/disasm");
        return disassemble(read(data), convertOpts(options));
    },
    async method(
        name: string,
        signature: string,
        _resources: string[],
        source: EntrySource,
        options?: Options
    ): Promise<string> {
        const data = await source(name);
        if (!data) {
            throw new Error("Class not found");
        }

        const { read } = await import("@katana-project/asm");

        const node = read(data);
        const method = node.methods.find((m) => signature === `${m.name.string}${m.type.string}`);
        if (!method) {
            throw new Error("Method not found");
        }

        const { disassembleMethod } = await import("@katana-project/asm/analysis/disasm");
        return disassembleMethod(node, method, convertOpts(options));
    },
} satisfies Worker);
