import type { Entry } from "$lib/workspace";
import { downloadBlob } from "$lib/action/utils";
import { get } from "svelte/store";
import { current } from "$lib/tab";

export const export_ = async (entry: Entry | null = null) => {
    entry = entry ?? (get(current)?.entry || null);
    if (entry) {
        await downloadBlob(entry.shortName, await entry.data.blob());
    }
};
