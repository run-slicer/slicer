import type { Disassembler } from "$lib/disasm";
import { roundRobin } from "$lib/utils";
import { classes } from "$lib/workspace";
import type { Member, Node } from "@run-slicer/asm";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createSource } from "../source";

export type Options = Record<string, string>;

export interface Worker {
    class(name: string, resources: string[], source: EntrySource, options?: Options): Promise<string>;
    method(name: string, signature: string, source: EntrySource, options?: Options): Promise<string>;
}

export interface InternalWorker {
    class(node: Node, options?: Options): Promise<string>;
    method(node: Node, method: Member, options?: Options): Promise<string>;
}

export const createFromWorker = (
    disasm: Partial<Disassembler>,
    workerFunc: () => Worker,
    method: boolean
): Disassembler => {
    if ((disasm.concurrency ?? 1) > 1) {
        workerFunc = roundRobin(disasm.concurrency!, workerFunc);
    } else {
        // use only one worker
        const worker = workerFunc();
        workerFunc = () => worker;
    }

    disasm.class = async (entry) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).string;

        const worker = workerFunc();

        const classes0 = get(classes);
        return await worker.class(
            name,
            Array.from(classes0.keys()),
            proxy(createSource(classes0, name, buf)),
            disasm.options
        );
    };
    if (method) {
        disasm.method = async (entry, method) => {
            const { node, data } = entry;

            const buf = await data.bytes();
            const name = (node.pool[node.thisClass.name] as UTF8Entry).string;
            const signature = method.name.string + method.type.string;

            const worker = workerFunc();

            const classes0 = get(classes);
            return await worker.method(name, signature, proxy(createSource(classes0, name, buf)), disasm.options);
        };
    }

    return disasm as Disassembler;
};

export const createInternalFromWorker = (
    disasm: Partial<Disassembler>,
    workerFunc: () => InternalWorker,
    method: boolean
): Disassembler => {
    if ((disasm.concurrency ?? 1) > 1) {
        workerFunc = roundRobin(disasm.concurrency!, workerFunc);
    } else {
        // use only one worker
        const worker = workerFunc();
        workerFunc = () => worker;
    }

    disasm.class = async (entry) => {
        const worker = workerFunc();

        return await worker.class(entry.node, disasm.options);
    };
    if (method) {
        disasm.method = async (entry, method) => {
            const worker = workerFunc();

            return await worker.method(entry.node, method, disasm.options);
        };
    }

    return disasm as Disassembler;
};
