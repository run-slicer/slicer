import type { ClassEntry, Entry } from "$lib/workspace";
import type { View } from "$lib/state";
import { current } from "$lib/disasm";
import { get } from "svelte/store";
import { formatHex } from "./hex";

export const read = async (view: View, entry: Entry | null): Promise<string> => {
    if (!entry) {
        return "";
    }

    if (view === "hex") {
        return await formatHex(entry.data);
    } else if (entry.type === "class") {
        const decompiler = get(current);

        return await decompiler.run(entry as ClassEntry);
    }

    return await entry.data.text();
};
