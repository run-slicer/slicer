import { type ClassEntry, type Entry } from "$lib/workspace";
import type { EditorConfig } from "$lib/components/pane";
import { current } from "$lib/decompiler";
import { get } from "svelte/store";
import { formatHex } from "./hex";

export const read = async (config: EditorConfig, entry: Entry | null): Promise<string> => {
    if (!entry) {
        return "";
    }

    if (config.view === "hex") {
        return await formatHex(entry.data);
    } else if (entry.type === "class") {
        const decompiler = get(current);

        return await decompiler.decompile(entry as ClassEntry);
    }

    return await entry.data.text();
};
