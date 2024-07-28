import { derived, get } from "svelte/store";
import { toolsDisasm, editorView } from "$lib/state";
import { type ClassEntry, current as currentWs } from "$lib/workspace";
import cfr from "./cfr";
import vf from "./vf";

export interface Disassembler {
    id: string;
    name?: string;
    group?: string;
    run(entry: ClassEntry): Promise<string>;
}

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
