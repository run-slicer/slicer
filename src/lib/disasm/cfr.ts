import type { Disassembler } from "./";
import { type Worker, createFunc } from "./worker";
import { wrap } from "comlink";
import CFRWorker from "./worker/cfr?worker";

export default {
    id: "cfr",
    name: "CFR",
    lang: "java",
    run: createFunc(wrap<Worker>(new CFRWorker())),
} as Disassembler;
