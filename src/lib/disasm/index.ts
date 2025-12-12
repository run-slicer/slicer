import { type Language, toExtension } from "$lib/lang";
import { error } from "$lib/log";
import { cancellable, type Cancellable, CancelledError, prettyError } from "$lib/utils";
import { type ClassEntry, type Entry, transformEntry } from "$lib/workspace";
import type { Member } from "@katana-project/asm";
import { get, writable } from "svelte/store";
import { cfr, jasm, procyon, slicer, vf } from "./builtin";

export type DisassemblerOptions = Record<string, string>;
export interface Disassembler {
    id: string;
    name?: string;
    version?: string;
    concurrency?: number;
    options: DisassemblerOptions;

    language(entry?: ClassEntry): Language;

    class: (entry: ClassEntry) => Cancellable<string>;
    method?: (entry: ClassEntry, method: Member) => Cancellable<string>;
}

export const all = writable<Map<string, Disassembler>>(
    new Map([
        [slicer.id, slicer],
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

export const disassemble = (entry: ClassEntry, disasm: Disassembler): Cancellable<string> => {
    return disasm.class(entry).map(null, (e) => {
        if (e instanceof CancelledError) {
            return "";
        }

        error(`failed to disassemble ${entry.name}`, e);
        return `// Failed to disassemble ${entry.name}; disassembler threw error.\n${prettyError(e).replaceAll(/^/gm, "// ")}`;
    });
};

export const disassembleMethod = (entry: ClassEntry, method: Member, disasm: Disassembler): Cancellable<string> => {
    if (!disasm.method) {
        return cancellable(() => {
            throw new Error("Disassembler does not support single-method disassembly");
        });
    }

    return disasm.method(entry, method).map(null, (e) => {
        if (e instanceof CancelledError) {
            return "";
        }

        const signature = method.name.string + method.type.string;
        error(`failed to disassemble ${entry.name}#${signature} method`, e);
        return `// Failed to disassemble ${entry.name}#${signature}; disassembler threw error.\n${prettyError(e).replaceAll(/^/gm, "// ")}`;
    });
};

export const disassembleEntry = (entry: ClassEntry, disasm: Disassembler): Cancellable<Entry> => {
    return disassemble(entry, disasm).map((output) =>
        transformEntry(entry, toExtension(disasm.language(entry) || "plaintext"), output)
    );
};
