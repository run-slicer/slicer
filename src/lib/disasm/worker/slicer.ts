import type { Member, Node } from "@run-slicer/asm";
import type { DisassemblyOptions } from "@run-slicer/asm/analysis/disasm";
import { expose } from "comlink";
import type { InternalWorker, Options } from "./";

const convertOpts = (options?: Options): DisassemblyOptions => ({
    indent: options?.indent ?? " ".repeat(4),
    fullyQualified: (options?.fullyQualified ?? "true") === "true",
});

expose({
    async class(node: Node, options?: Options): Promise<string> {
        const { disassemble } = await import("@run-slicer/asm/analysis/disasm");

        return disassemble(node, convertOpts(options));
    },
    async method(node: Node, method: Member, options?: Options): Promise<string> {
        const { disassembleMethod } = await import("@run-slicer/asm/analysis/disasm");

        return disassembleMethod(node, method, convertOpts(options));
    },
} satisfies InternalWorker);
