import type { Disassembler } from "$lib/disasm";
import { analysisJdkClasses } from "$lib/state";
import { roundRobin } from "$lib/utils";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createResources, createSource } from "../source";

export type Options = Record<string, string>;

export interface Worker {
    class(name: string, resources: string[], source: EntrySource, options?: Options): Promise<string>;
    method(
        name: string,
        signature: string,
        resources: string[],
        source: EntrySource,
        options?: Options
    ): Promise<string>;
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

        const needJdk = get(analysisJdkClasses) && useJdkClasses;
        return await worker.class(
            name,
            createResources(needJdk),
            proxy(createSource(name, buf, needJdk)),
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

            const needJdk = get(analysisJdkClasses) && useJdkClasses;
            return await worker.method(
                name,
                signature,
                createResources(needJdk),
                proxy(createSource(name, buf, needJdk)),
                disasm.options
            );
        };
    }

    return disasm as Disassembler;
};
