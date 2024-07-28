import { derived, get } from "svelte/store";
import { toolsDisasm, editorView } from "$lib/state";
import { type Entry, type ClassEntry, current as currentWs, readDetail } from "$lib/workspace";
import cfr from "./cfr";
import vf from "./vf";

export interface Disassembler {
    id: string;
    name?: string;
    group?: string;
    run(entry: ClassEntry): Promise<string>;
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

        entry = await readDetail(entry);
        if (entry.type !== "class") {
            return null; // not a class
        }

        return entry.data.arrayBuffer().then((ab) => new Uint8Array(ab));
    };
};

export const all: Map<string, Disassembler> = new Map([
    [cfr.id, cfr],
    [vf.id, vf],
]);

export const current = derived(toolsDisasm, ($toolsDisasm) => {
    return all.get($toolsDisasm) || cfr;
});

current.subscribe(() => {
    const entry = get(currentWs);
    if (entry && entry.type === "class" && get(editorView) !== "hex") {
        currentWs.set(entry); // disassembled view, force update
    }
});
