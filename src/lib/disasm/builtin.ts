import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createFromWorker, createInternalFromWorker, type InternalWorker, type Worker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import ProcyonWorker from "./worker/procyon?worker";
import SlicerWorker from "./worker/slicer?worker";
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

export const slicer: Disassembler = createInternalFromWorker(
    {
        id: "slicer",
        name: "slicer",
        language: "java",
        concurrency: 5,
    },
    () => wrap<InternalWorker>(new SlicerWorker()),
    true
);
