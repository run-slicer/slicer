import type { Disassembler } from "./";
import { type Worker, createFunc } from "./worker";
import { wrap } from "comlink";
import JASMWorker from "./worker/jasm.worker?worker";

export default {
    id: "jasm",
    name: "JASM",
    lang: "jasm",
    run: createFunc(wrap<Worker>(new JASMWorker())),
} as Disassembler;
