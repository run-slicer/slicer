import { type ClassEntry, classes, type Entry, EntryType, readDetail } from "$lib/workspace";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { get } from "svelte/store";
import { proxy } from "comlink";

export interface Worker {
    run(name: string, resources: string[], source: EntrySource): Promise<string>;
}

export type EntrySource = (name: string) => Promise<Uint8Array | null>;

const createSource = (classes: Map<string, Entry>, name: string, buf: Uint8Array): EntrySource => {
    return async (name0) => {
        if (name0 === name) {
            return buf;
        }

        let entry = classes.get(name0);
        if (!entry) {
            return null;
        }

        entry = await readDetail(entry);
        if (entry.type !== EntryType.CLASS) {
            return null; // not a class
        }

        return entry.data.bytes();
    };
};

type DisassemblyFunc = (entry: ClassEntry) => Promise<string>;

export const createFunc = (worker: Worker): DisassemblyFunc => {
    return async (entry) => {
        const { node, data } = entry;

        const buf = await data.bytes();
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();

        const classes0 = get(classes);
        return await worker.run(name, Array.from(classes0.keys()), proxy(createSource(classes0, name, buf)));
    };
};
