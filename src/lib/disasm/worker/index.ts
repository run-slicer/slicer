import type { Disassembler } from "$lib/disasm";
import { analysisJdkClasses } from "$lib/state";
import { roundRobin } from "$lib/utils";
import { classes } from "$lib/workspace";
import { index } from "$lib/workspace/jdk";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createSource } from "../source";

export type Options = Record<string, string>;

export interface Worker {
    class(name: string, resources: string[], source: EntrySource, options?: Options): Promise<string>;
    method(name: string, signature: string, source: EntrySource, options?: Options): Promise<string>;
}

export const createFromWorker = (
    disasm: Partial<Disassembler>,
    workerFunc: () => Worker,
    method: boolean,
    useJdkClasses: boolean = true
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
            [...Array.from(classes0.keys()), ...Array.from(index.keys())],
            proxy(createSource(classes0, name, buf, get(analysisJdkClasses) && useJdkClasses)),
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
            return await worker.method(
                name,
                signature,
                proxy(createSource(get(classes), name, buf, get(analysisJdkClasses) && useJdkClasses)),
                disasm.options
            );
        };
    }

    return disasm as Disassembler;
};
