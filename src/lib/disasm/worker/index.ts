import { createSource, type EntrySource } from "../source";
import type { DisassemblyFunc } from "../";
import { classes } from "$lib/workspace";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { get } from "svelte/store";
import { proxy } from "comlink";

export interface Worker {
    run(name: string, resources: string[], source: EntrySource): Promise<string>;
}

export const createFunc = (worker: Worker): DisassemblyFunc => {
    return async (entry) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();

        const classes0 = get(classes);
        return await worker.run(name, Array.from(classes0.keys()), proxy(createSource(classes0, name, buf)));
    };
};
