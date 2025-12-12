import type { Disassembler, DisassemblerOptions } from "$lib/disasm";
import { analysisJdkClasses, toolsDisasmOptions } from "$lib/state";
import { createDefaultWorkerPool } from "$lib/worker";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createResources, createSource } from "../source";

export interface DisassemblyWorker {
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
    disasm: Omit<Disassembler, "options" | "class" | "method" | "concurrency">,
    workerFunc: () => Worker,
    method: boolean,
    useJdkClasses: boolean = true
): Disassembler => {
    const workers = createDefaultWorkerPool<DisassemblyWorker>(workerFunc);
    const result: Disassembler = {
        ...disasm,
        concurrency: workers.size,
        get options(): DisassemblerOptions {
            return get(toolsDisasmOptions)[this.id] ?? {};
        },
        set options(options: DisassemblerOptions) {
            toolsDisasmOptions.update(($opts) => {
                $opts[this.id] = options;
                return $opts;
            });
        },
        class(entry) {
            return workers.instance().cancellable(async (w) => {
                const { node, data } = entry;

                const buf = await data.bytes();
                const name = (node.pool[node.thisClass.name] as UTF8Entry).string;

                const needJdk = get(analysisJdkClasses) && useJdkClasses;
                return w.class(name, createResources(needJdk), proxy(createSource(name, buf, needJdk)), result.options);
            });
        },
        method: !method
            ? undefined
            : (entry, method) => {
                  return workers.instance().cancellable(async (w) => {
                      const { node, data } = entry;

                      const buf = await data.bytes();
                      const name = (node.pool[node.thisClass.name] as UTF8Entry).string;
                      const signature = method.name.string + method.type.string;

                      const needJdk = get(analysisJdkClasses) && useJdkClasses;
                      return w.method(
                          name,
                          signature,
                          createResources(needJdk),
                          proxy(createSource(name, buf, needJdk)),
                          result.options
                      );
                  });
              },
    };

    return result;
};
