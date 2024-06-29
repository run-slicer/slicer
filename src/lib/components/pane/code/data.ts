import { type ClassEntry, type Entry } from "$lib/workspace";
import { current } from "$lib/decompiler";
import { get } from "svelte/store";

export const read = async (entry: Entry | null): Promise<string> => {
    if (!entry) {
        return "";
    }

    switch (entry.type) {
        case "class":
            const decompiler = get(current);
            return await decompiler.decompile(entry as ClassEntry);
    }

    return await entry.data.text();
};
