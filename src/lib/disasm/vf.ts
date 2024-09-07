import type { Disassembler } from "./";
import { type Worker, createFunc } from "./worker";
import { wrap } from "comlink";
import VFWorker from "./worker/vf?worker";

export default {
    id: "vf",
    name: "Vineflower",
    lang: "java",
    run: createFunc(wrap<Worker>(new VFWorker())),
} as Disassembler;
