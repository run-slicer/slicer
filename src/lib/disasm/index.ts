import type { ClassEntry } from "$lib/workspace";
import jasm from "./jasm";
import cfr from "./cfr";
import vf from "./vf";
import type { Language } from "$lib/lang";

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
