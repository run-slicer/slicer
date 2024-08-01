import { type Entry, readDetail } from "$lib/workspace";
import { current, TabType } from "$lib/tab";
import { get } from "svelte/store";

export const open = async (entry: Entry, type: TabType = TabType.CODE) => {
    const tab = get(current);
    if (tab?.type === type && tab?.entry?.data?.name === entry.data.name) {
        return; // already opened
    }

    current.set({
        id: `${type}:${entry.data.name}`,
        type,
        name: entry.data.shortName,
        entry: await readDetail(entry),
    });
};
