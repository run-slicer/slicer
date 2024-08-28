import type { ClassEntry } from "$lib/workspace";
import jasm from "./jasm";
import cfr from "./cfr";
import vf from "./vf";
import type { Language } from "$lib/lang";
import { error } from "$lib/logging";

export interface Disassembler {
    id: string;
    name?: string;
    lang?: Language;
    run(entry: ClassEntry): Promise<string>;
}

export const all: Map<string, Disassembler> = new Map([
    [jasm.id, jasm],
    [cfr.id, cfr],
    [vf.id, vf],
]);

export const disasmSafe = async (disasm: Disassembler, entry: ClassEntry): Promise<string> => {
    try {
        return await disasm.run(entry);
    } catch (e: any) {
        error(`failed to disassemble ${entry.name}`, e);

        return `
        // Failed to disassemble ${entry.name}; disassembler threw error.
        // ${e.toString()}
        `.trim();
    }
};
