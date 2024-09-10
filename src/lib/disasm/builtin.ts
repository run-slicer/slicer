import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createFunc, type Worker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import VFWorker from "./worker/vf?worker";

export const cfr: Disassembler = {
    id: "cfr",
    name: "CFR",
    lang: "java",
    run: createFunc(wrap<Worker>(new CFRWorker())),
};

export const jasm: Disassembler = {
    id: "jasm",
    name: "JASM",
    lang: "jasm",
    run: createFunc(wrap<Worker>(new JASMWorker())),
};

export const vf: Disassembler = {
    id: "vf",
    name: "Vineflower",
    lang: "java",
    run: createFunc(wrap<Worker>(new VFWorker())),
};
