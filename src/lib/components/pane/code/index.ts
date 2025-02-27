import { disassemble, disassembleMethod, type Disassembler } from "$lib/disasm";
import { fromExtension, type Language } from "$lib/lang";
import { TabType } from "$lib/tab";
import { formatHex } from "$lib/utils";
import { type ClassEntry, type Entry, EntryType, type MemberEntry } from "$lib/workspace";

export const isDisassembled = (tabType: TabType, entry: Entry): boolean => {
    return tabType === TabType.HEX || entry.type === EntryType.CLASS || entry.type === EntryType.MEMBER;
};

export const detectLanguage = (tabType: TabType, entry: Entry, disasm: Disassembler): Language => {
    if (tabType === TabType.HEX) {
        return "hex";
    } else if (entry.type === EntryType.CLASS || entry.type === EntryType.MEMBER) {
        // disassembled view
        const classEntry = entry as ClassEntry;

        return disasm.languageContextual?.(classEntry) || disasm.language || "plaintext";
    }

    return entry.extension ? fromExtension(entry.extension) : "plaintext";
};

export const read = async (tabType: TabType, entry: Entry, disasm: Disassembler): Promise<string> => {
    if (tabType === TabType.HEX) {
        return formatHex(await entry.data.bytes());
    } else if (entry.type === EntryType.CLASS) {
        return disassemble(entry as ClassEntry, disasm);
    } else if (entry.type === EntryType.MEMBER) {
        const memberEntry = entry as MemberEntry;

        return disassembleMethod(memberEntry, memberEntry.member, disasm);
    }

    return entry.data.text();
};
