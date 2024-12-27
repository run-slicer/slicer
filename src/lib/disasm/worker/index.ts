import { type ClassEntry, classes } from "$lib/workspace";
import type { Member } from "@run-slicer/asm";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { proxy } from "comlink";
import { get } from "svelte/store";
import { type EntrySource, createSource } from "../source";

export interface ClassWorker {
    class(name: string, resources: string[], source: EntrySource): Promise<string>;
}

export interface MethodWorker {
    method(name: string, signature: string, source: EntrySource): Promise<string>;
}

type DisassemblyFunc = (entry: ClassEntry) => Promise<string>;
type MethodDisassemblyFunc = (entry: ClassEntry, method: Member) => Promise<string>;

export const createClassFunc = (numWorkers: number, workerFunc: () => ClassWorker): DisassemblyFunc => {
    const workers = new Array<ClassWorker>(numWorkers);
    for (let i = 0; i < numWorkers; i++) {
        workers[i] = workerFunc();
    }

    let currWorker = 0;
    return async (entry) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();

        // evenly distribute load
        const worker = workers[currWorker++];
        if (currWorker >= workers.length) {
            currWorker = 0; // wrap around
        }

        const classes0 = get(classes);
        return await worker.class(name, Array.from(classes0.keys()), proxy(createSource(classes0, name, buf)));
    };
};

export const createMethodFunc = (numWorkers: number, workerFunc: () => MethodWorker): MethodDisassemblyFunc => {
    const workers = new Array<MethodWorker>(numWorkers);
    for (let i = 0; i < numWorkers; i++) {
        workers[i] = workerFunc();
    }

    let currWorker = 0;
    return async (entry, method) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();
        const signature = method.name.decode() + method.type.decode();

        // evenly distribute load
        const worker = workers[currWorker++];
        if (currWorker >= workers.length) {
            currWorker = 0; // wrap around
        }

        const classes0 = get(classes);
        return await worker.method(name, signature, proxy(createSource(classes0, name, buf)));
    };
};
