import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createClassFunc, createMethodFunc, type ClassWorker, type MethodWorker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import ProcyonWorker from "./worker/procyon?worker";
import VFWorker from "./worker/vf?worker";

export const cfr: Disassembler = {
    id: "cfr",
    name: "CFR",
    language: "java",
    concurrency: 5,
    class: createClassFunc(5, () => wrap<ClassWorker>(new CFRWorker())),
};

export const jasm: Disassembler = {
    id: "jasm",
    name: "JASM",
    language: "jasm",
    concurrency: 5,
    class: createClassFunc(5, () => wrap<ClassWorker>(new JASMWorker())),
    method: createMethodFunc(5, () => wrap<MethodWorker>(new JASMWorker())),
};

export const vf: Disassembler = {
    id: "vf",
    name: "Vineflower",
    language: "java",
    concurrency: 5,
    class: createClassFunc(5, () => wrap<ClassWorker>(new VFWorker())),
};

export const procyon: Disassembler = {
    id: "procyon",
    name: "Procyon",
    language: "java",
    concurrency: 5,
    class: createClassFunc(5, () => wrap<ClassWorker>(new ProcyonWorker())),
};

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
