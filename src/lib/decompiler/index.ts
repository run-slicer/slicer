import { get, writable } from "svelte/store";
import { type Entry, type ClassEntry, current as currentWs, narrow } from "$lib/workspace";
import cfr from "./cfr";
import vf from "./vf";

export interface Decompiler {
    id: string;
    name?: string;
    decompile: (entry: ClassEntry) => Promise<string>;
}

export type EntrySource = (name: string) => Promise<Uint8Array | null>;

export const createSource = (classes: Map<string, Entry>, name: string, buf: Uint8Array): EntrySource => {
    return async (name0) => {
        if (name0 === name) {
            return buf;
        }

        let entry = classes.get(name0);
        if (!entry) {
            return null;
        }

        entry = await narrow(entry);
        if (entry.type !== "class") {
            return null; // not a class
        }

        return entry.data.arrayBuffer().then((ab) => new Uint8Array(ab));
    };
};

export const all: Map<string, Decompiler> = new Map([
    [cfr.id, cfr],
    [vf.id, vf],
]);

export const current = writable<Decompiler>(cfr);

current.subscribe(() => {
    const entry = get(currentWs);
    if (entry && entry.type === "class") {
        currentWs.set(entry); // force update
    }
});

export const swap = (id: string) => {
    const next = all.get(id);
    if (!next || next.id === get(current).id) {
        return;
    }

    current.set(next);
};
