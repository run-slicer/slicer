import { roundRobin } from "$lib/utils";
import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createClassFunc, createMethodFunc, type Worker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import ProcyonWorker from "./worker/procyon?worker";
import VFWorker from "./worker/vf?worker";

export const cfr: Disassembler = {
    id: "cfr",
    name: "CFR",
    language: "java",
    concurrency: 5,
    class: createClassFunc(roundRobin(5, () => wrap<Worker>(new CFRWorker()))),
};

const jasmWorkerSource = roundRobin(5, () => wrap<Worker>(new JASMWorker()));
export const jasm: Disassembler = {
    id: "jasm",
    name: "JASM",
    language: "jasm",
    concurrency: 5,
    class: createClassFunc(jasmWorkerSource),
    method: createMethodFunc(jasmWorkerSource),
};

export const vf: Disassembler = {
    id: "vf",
    name: "Vineflower",
    language: "java",
    concurrency: 5,
    class: createClassFunc(roundRobin(5, () => wrap<Worker>(new VFWorker()))),
};

export const procyon: Disassembler = {
    id: "procyon",
    name: "Procyon",
    language: "java",
    concurrency: 5,
    class: createClassFunc(roundRobin(5, () => wrap<Worker>(new ProcyonWorker()))),
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
