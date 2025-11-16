import type { Disassembler, DisassemblerOptions } from "$lib/disasm";
import { analysisJdkClasses, toolsDisasmOptions } from "$lib/state";
import { roundRobin } from "$lib/utils";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createResources, createSource } from "../source";

export const MAX_CONCURRENT = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));

export interface Worker {
    class(name: string, resources: string[], source: EntrySource, options?: DisassemblerOptions): Promise<string>;
    method(
        name: string,
        signature: string,
        resources: string[],
        source: EntrySource,
        options?: DisassemblerOptions
    ): Promise<string>;
}

export const createFromWorker = (
    disasm: Omit<Disassembler, "options" | "class" | "method">,
    workerFunc: () => Worker,
    method: boolean,
    useJdkClasses: boolean = true
): Disassembler => {
    if (MAX_CONCURRENT > 1) {
        workerFunc = roundRobin(MAX_CONCURRENT, workerFunc);
    } else {
        // use only one worker
        const worker = workerFunc();
        workerFunc = () => worker;
    }

    const result: Disassembler = {
        ...disasm,
        get options(): DisassemblerOptions {
            return get(toolsDisasmOptions)[this.id] ?? {};
        },
        set options(options: DisassemblerOptions) {
            toolsDisasmOptions.update(($opts) => {
                $opts[this.id] = options;
                return $opts;
            });
        },
        async class(entry) {
            const { node, data } = entry;

            const buf = await data.bytes();
            const name = (node.pool[node.thisClass.name] as UTF8Entry).string;

            const worker = workerFunc();

            const needJdk = get(analysisJdkClasses) && useJdkClasses;
            return await worker.class(
                name,
                createResources(needJdk),
                proxy(createSource(name, buf, needJdk)),
                result.options
            );
        },
        method: !method
            ? undefined
            : async (entry, method) => {
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
                      result.options
                  );
              },
    };

    return result;
};
