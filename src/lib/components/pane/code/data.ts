import { type ClassEntry, type Entry } from "$lib/workspace";
import type { Config } from "$lib/config";
import { current } from "$lib/decompiler";
import { get } from "svelte/store";
import { formatHex } from "./hex";

export const read = async (config: Config, entry: Entry | null): Promise<string> => {
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
