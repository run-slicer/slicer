import { derived, get } from "svelte/store";
import { editorView, toolsDisasm, View } from "$lib/state";
import { type ClassEntry, EntryType } from "$lib/workspace";
import { current as currentTab, TabType } from "$lib/tab";
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
    const tab = get(currentTab);
    if (tab && tab.type === TabType.CODE && tab.entry?.type === EntryType.CLASS && get(editorView) !== View.HEX) {
        currentTab.set(tab); // disassembled view, force update
    }
});
