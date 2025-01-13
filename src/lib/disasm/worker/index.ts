import { type ClassEntry, classes } from "$lib/workspace";
import type { Member } from "@run-slicer/asm";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createSource } from "../source";

export interface Worker {
    class(name: string, resources: string[], source: EntrySource): Promise<string>;
    method(name: string, signature: string, source: EntrySource): Promise<string>;
}

type DisassemblyFunc = (entry: ClassEntry) => Promise<string>;
type MethodDisassemblyFunc = (entry: ClassEntry, method: Member) => Promise<string>;

export const createClassFunc = (workerFunc: () => Worker): DisassemblyFunc => {
    return async (entry) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();

        const worker = workerFunc();

        const classes0 = get(classes);
        return await worker.class(name, Array.from(classes0.keys()), proxy(createSource(classes0, name, buf)));
    };
};

export const createMethodFunc = (workerFunc: () => Worker): MethodDisassemblyFunc => {
    return async (entry, method) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();
        const signature = method.name.decode() + method.type.decode();

        const worker = workerFunc();

        const classes0 = get(classes);
        return await worker.method(name, signature, proxy(createSource(classes0, name, buf)));
    };
};
