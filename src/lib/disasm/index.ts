import type { ClassEntry } from "$lib/workspace";
import type { Language } from "$lib/lang";
import { error } from "$lib/logging";
import { get, writable } from "svelte/store";
import jasm from "./jasm";
import cfr from "./cfr";
import vf from "./vf";

export type DisassemblyFunc = (entry: ClassEntry) => Promise<string>;

export interface Disassembler {
    id: string;
    name?: string;
    lang?: Language;

    run: DisassemblyFunc;
}

export const all = writable<Map<string, Disassembler>>(
    new Map([
        [jasm.id, jasm],
        [cfr.id, cfr],
        [vf.id, vf],
    ])
);

export const find = (id: string): Disassembler | null => {
    return get(all).get(id) || null;
};

export const add = (disasm: Disassembler) => {
    all.update(($all) => {
        $all.set(disasm.id, disasm);
        return $all;
    });
};

export const remove = (id: string) => {
    all.update(($all) => {
        $all.delete(id);
        return $all;
    });
};

export const disasmSafe = async (disasm: Disassembler, entry: ClassEntry): Promise<string> => {
    try {
        return await disasm.run(entry);
    } catch (e: any) {
        error(`failed to disassemble ${entry.name}`, e);

        return `// Failed to disassemble ${entry.name}; disassembler threw error.\n${e.toString().replaceAll(/^/gm, "// ")}`;
    }
};
