import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createFromWorker, type Worker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import ProcyonWorker from "./worker/procyon?worker";
import VFWorker from "./worker/vf?worker";

export const cfr: Disassembler = createFromWorker(
    {
        id: "cfr",
        name: "CFR",
        language: "java",
        concurrency: 5,
    },
    () => wrap<Worker>(new CFRWorker()),
    false
);

export const jasm: Disassembler = createFromWorker(
    {
        id: "jasm",
        name: "JASM",
        language: "jasm",
        concurrency: 5,
    },
    () => wrap<Worker>(new JASMWorker()),
    true
);

export const vf: Disassembler = createFromWorker(
    {
        id: "vf",
        name: "Vineflower",
        language: "java",
        concurrency: 5,
    },
    () => wrap<Worker>(new VFWorker()),
    false
);

export const procyon: Disassembler = createFromWorker(
    {
        id: "procyon",
        name: "Procyon",
        language: "java",
        concurrency: 5,
    },
    () => wrap<Worker>(new ProcyonWorker()),
    false
);

export const slicer: Disassembler = {
    id: "slicer",
    name: "slicer",
    language: "java",
    async class(entry): Promise<string> {
        const { disassemble } = await import("@run-slicer/asm/analysis/disasm");

        return disassemble(entry.node);
    },
    async method(entry, method): Promise<string> {
        const { disassembleMethod } = await import("@run-slicer/asm/analysis/disasm");

        return disassembleMethod(entry.node, method);
    },
};
