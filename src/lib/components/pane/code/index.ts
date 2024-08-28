import { type ClassEntry, type Entry, EntryType } from "$lib/workspace";
import { disasmSafe, type Disassembler } from "$lib/disasm";
import { formatHex } from "./hex";
import { timed } from "$lib/action/utils";
import { fromExtension, type Language } from "$lib/lang";
import { TabType } from "$lib/tab";

export const detectLanguage = (tabType: TabType, entry: Entry | null, disasm: Disassembler): Language => {
    if (!entry) {
        return "plaintext";
    }

    if (tabType === TabType.HEX) {
        return "hex";
    } else if (entry.type === EntryType.CLASS) {
        // disassembled view
        return disasm.lang || "plaintext";
    }

    return entry.extension ? fromExtension(entry.extension) : "plaintext";
};

export const read = async (tabType: TabType, entry: Entry | null, disasm: Disassembler): Promise<string> => {
    if (!entry) {
        return "";
    }

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
