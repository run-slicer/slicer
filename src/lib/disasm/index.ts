import { type Language, toExtension } from "$lib/lang";
import { error } from "$lib/log";
import { type ClassEntry, type Entry, transformEntry } from "$lib/workspace";
import { get, writable } from "svelte/store";
import { cfr, jasm, procyon, vf } from "./builtin";

export interface Disassembler {
    id: string;
    name?: string;
    language?: Language;
    concurrency?: number;

    run(entry: ClassEntry): Promise<string>;
}

export const all = writable<Map<string, Disassembler>>(
    new Map([
        [jasm.id, jasm],
        [cfr.id, cfr],
        [vf.id, vf],
        [procyon.id, procyon],
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

export const disassemble = async (entry: ClassEntry, disasm: Disassembler): Promise<string> => {
    try {
        return disasm.run(entry);
    } catch (e: any) {
        error(`failed to disassemble ${entry.name}`, e);

        return `// Failed to disassemble ${entry.name}; disassembler threw error.\n${e.toString().replaceAll(/^/gm, "// ")}`;
    }
};

export const disassembleEntry = async (entry: ClassEntry, disasm: Disassembler): Promise<Entry> => {
    return transformEntry(entry, toExtension(disasm.language || "plaintext"), await disassemble(entry, disasm));
};
