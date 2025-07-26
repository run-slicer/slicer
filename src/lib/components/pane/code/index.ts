import { disassemble, disassembleMethod, type Disassembler } from "$lib/disasm";
import { fromExtension, type Language } from "$lib/lang";
import { formatHex } from "$lib/utils";
import { type ClassEntry, type Entry, EntryType, type MemberEntry } from "$lib/workspace";

export enum Interpretation {
    TEXT = "text",
    HEX = "hex",
    CLASS = "class",
}

export interface InterpretationOptions {
    hexRowBytes: number;
}

// prettier-ignore
const extensions = {
    [Interpretation.HEX]: [
        "bin", "tar", "gz", "rar", "zip", "7z", "jar", "apk", "dex", "lzma", "dll", "so", "dylib", "exe", "kotlin_builtins",
        "kotlin_metadata", "kotlin_module", "nbt", "ogg", "cer", "der", "crt",
    ],
};

const typesByExts = new Map(
    (Object.entries(extensions) as [Interpretation, string[]][]).flatMap(([k, v]) => v.map((ext) => [ext, k]))
);

export const detectInterpretation = (entry: Entry): Interpretation => {
    if (entry.type === EntryType.CLASS || entry.type === EntryType.MEMBER) {
        return Interpretation.CLASS;
    }

    return entry.extension ? typesByExts.get(entry.extension) || Interpretation.TEXT : Interpretation.TEXT;
};

export const canInterpret = (type: Interpretation, entry: Entry): boolean => {
    switch (type) {
        case Interpretation.CLASS:
            return entry.type === EntryType.CLASS || entry.type === EntryType.MEMBER;
    }

    return true;
};

export const detectLanguage = (type: Interpretation, entry: Entry, disasm: Disassembler): Language => {
    switch (type) {
        case Interpretation.CLASS:
            return disasm.language(entry as ClassEntry) || "plaintext";
        case Interpretation.HEX:
            return "hex";
    }

    return entry.extension ? fromExtension(entry.extension) : "plaintext";
};

export const read = async (
    type: Interpretation,
    entry: Entry,
    disasm: Disassembler,
    options: InterpretationOptions
): Promise<string> => {
    switch (type) {
        case Interpretation.CLASS:
            if (entry.type === EntryType.MEMBER) {
                const memberEntry = entry as MemberEntry;

                return disassembleMethod(memberEntry, memberEntry.member, disasm);
            }

            return disassemble(entry as ClassEntry, disasm);
        case Interpretation.HEX:
            return formatHex(await entry.data.bytes(), options.hexRowBytes);
    }

    return entry.data.text();
};
