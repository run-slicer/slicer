import { get } from "svelte/store";
import type { Entry } from "$lib/workspace";
import { current as currentTab } from "$lib/tab";
import { downloadBlob } from "$lib/utils";

export const export_ = async (entry: Entry | null = get(currentTab)?.entry || null) => {
    if (entry) {
        await downloadBlob(entry.shortName, await entry.data.blob());
    }
};
