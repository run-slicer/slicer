import type { Language } from "$lib/lang";
import type { ClassEntry } from "$lib/workspace";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { ConstantType } from "@katana-project/asm/spec";
import { wrap } from "comlink";
import type { Disassembler } from "./";
import { createFromWorker, type Worker } from "./worker";
import CFRWorker from "./worker/cfr?worker";
import JASMWorker from "./worker/jasm?worker";
import ProcyonWorker from "./worker/procyon?worker";
import SlicerWorker from "./worker/slicer?worker";
import VFWorker from "./worker/vf?worker";

export const cfr: Disassembler = createFromWorker(
    {
        id: "cfr",
        name: "CFR",
        version: "0.152",
        language: () => "java",
        concurrency: 5,
    },
    () => wrap<Worker>(new CFRWorker()),
    false
);

export const jasm: Disassembler = createFromWorker(
    {
        id: "jasm",
        name: "JASM",
        version: "2.8.0",
        language: () => "jasm",
        concurrency: 5,
    },
    () => wrap<Worker>(new JASMWorker()),
    true
);

export const vf: Disassembler = createFromWorker(
    {
        id: "vf",
        name: "Vineflower",
        version: "1.11.2",
        concurrency: 5,
        language(entry?: ClassEntry): Language {
            if (!entry) {
                return "java";
            }

            const pool = entry.node.pool;

            // search for annotation descriptor
            const hasMeta = pool.some((e) => {
                return e?.type === ConstantType.UTF8 && (e as UTF8Entry).string === "Lkotlin/Metadata;";
            });
            return (this.options?.["kt-enable"] ?? "1") === "1" && hasMeta ? "kotlin" : "java";
        },
    },
    () => wrap<Worker>(new VFWorker()),
    false
);

export const procyon: Disassembler = createFromWorker(
    {
        id: "procyon",
        name: "Procyon",
        version: "0.6.0",
        language: () => "java",
        concurrency: 5,
    },
    () => wrap<Worker>(new ProcyonWorker()),
    false,
    false // Procyon is weird and wants to scan the entire JDK
);

export const slicer: Disassembler = createFromWorker(
    {
        id: "slicer",
        name: "slicer",
        language: () => "java",
        concurrency: 5,
    },
    () => wrap<Worker>(new SlicerWorker()),
    true
);
