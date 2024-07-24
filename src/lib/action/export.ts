import { type Entry, current as currentWs } from "$lib/workspace";
import { downloadBlob } from "$lib/action/utils";
import { get } from "svelte/store";

export const export_ = async (entry: Entry | null = null) => {
    entry = entry ?? get(currentWs);
    if (entry) {
        await downloadBlob(entry.data.shortName, await entry.data.blob());
    }
};
