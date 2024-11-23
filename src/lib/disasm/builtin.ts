import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createFunc, type Worker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import VFWorker from "./worker/vf?worker";

export const cfr: Disassembler = {
    id: "cfr",
    name: "CFR",
    language: "java",
    concurrency: 5,
    run: createFunc(5, () => wrap<Worker>(new CFRWorker())),
};

export const jasm: Disassembler = {
    id: "jasm",
    name: "JASM",
    language: "jasm",
    concurrency: 5,
    run: createFunc(5, () => wrap<Worker>(new JASMWorker())),
};

export const vf: Disassembler = {
    id: "vf",
    name: "Vineflower",
    language: "java",
    concurrency: 5,
    run: createFunc(5, () => wrap<Worker>(new VFWorker())),
};
