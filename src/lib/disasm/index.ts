import { derived, get } from "svelte/store";
import { toolsDisasm } from "$lib/state";
import { type ClassEntry, EntryType } from "$lib/workspace";
import { current as currentTab, TabType } from "$lib/tab";
import jasm from "./jasm";
import cfr from "./cfr";
import vf from "./vf";
import type { Language } from "$lib/lang";

export interface Disassembler {
    id: string;
    name?: string;
    group?: string;
    lang?: Language;
    run(entry: ClassEntry): Promise<string>;
}

export const all: Map<string, Disassembler> = new Map([
    [jasm.id, jasm],
    [cfr.id, cfr],
    [vf.id, vf],
]);

export const current = derived(toolsDisasm, ($toolsDisasm) => {
    return all.get($toolsDisasm) || cfr;
});

current.subscribe(() => {
    const tab = get(currentTab);
    if (tab && tab.type === TabType.CODE && tab.entry?.type === EntryType.CLASS) {
        currentTab.set(tab); // disassembled view, force update
    }
});
