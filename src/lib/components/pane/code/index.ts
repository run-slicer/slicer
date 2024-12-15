import { disassemble, type Disassembler } from "$lib/disasm";
import { fromExtension, type Language } from "$lib/lang";
import { TabType } from "$lib/tab";
import { type ClassEntry, type Entry, EntryType } from "$lib/workspace";
import { formatHex } from "./hex";

export const isDisassembled = (tabType: TabType, entry: Entry): boolean => {
    return tabType === TabType.HEX || entry.type === EntryType.CLASS;
};

export const detectLanguage = (tabType: TabType, entry: Entry, disasm: Disassembler): Language => {
    if (tabType === TabType.HEX) {
        return "hex";
    } else if (entry.type === EntryType.CLASS) {
        // disassembled view
        return disasm.language || "plaintext";
    }

    return entry.extension ? fromExtension(entry.extension) : "plaintext";
};

export const read = (tabType: TabType, entry: Entry, disasm: Disassembler): Promise<string> => {
    if (tabType === TabType.HEX) {
        return formatHex(entry.data);
    } else if (entry.type === EntryType.CLASS) {
        return disassemble(entry as ClassEntry, disasm);
    }

    return entry.data.text();
};
