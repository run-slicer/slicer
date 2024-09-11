import { type ClassEntry, type Entry, EntryType, memoryData } from "$lib/workspace";
import { disasmSafe, type Disassembler } from "$lib/disasm";
import { formatHex } from "./hex";
import { timed } from "$lib/utils";
import { fromExtension, type Language, toExtension } from "$lib/lang";
import { TabType } from "$lib/tab";

export const isDisassembled = (tabType: TabType, entry: Entry): boolean => {
    return tabType === TabType.HEX || entry.type === EntryType.CLASS;
};

export const detectLanguage = (tabType: TabType, entry: Entry, disasm: Disassembler): Language => {
    if (tabType === TabType.HEX) {
        return "hex";
    } else if (entry.type === EntryType.CLASS) {
        // disassembled view
        return disasm.lang || "plaintext";
    }

    return entry.extension ? fromExtension(entry.extension) : "plaintext";
};

export const read = async (tabType: TabType, entry: Entry, disasm: Disassembler): Promise<string> => {
    const { result } = await timed(`read ${entry.name}`, async () => {
        if (tabType === TabType.HEX) {
            return await formatHex(entry.data);
        } else if (entry.type === EntryType.CLASS) {
            return await disasmSafe(disasm, entry as ClassEntry);
        }

        return await entry.data.text();
    });

    return result;
};

const replaceExt = (path: string, ext: string): string => {
    const index = path.lastIndexOf(".");
    if (index !== -1) {
        path = path.substring(0, index);
    }

    return `${path}.${ext}`;
};

const encoder = new TextEncoder();
export const createTextEntry = (entry: Entry, lang: Language, value: string): Entry => {
    const ext = toExtension(lang);

    return {
        type: EntryType.FILE,
        name: replaceExt(entry.name, ext),
        shortName: replaceExt(entry.shortName, ext),
        extension: ext,
        data: memoryData(replaceExt(entry.data.name, ext), encoder.encode(value)),
    };
};
