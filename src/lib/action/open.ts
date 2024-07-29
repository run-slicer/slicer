import { type Entry, readDetail } from "$lib/workspace";
import { current, TabType } from "$lib/tab";
import { get } from "svelte/store";

export const open = async (entry: Entry) => {
    if (get(current)?.entry?.data?.name === entry.data.name) {
        return; // already opened
    }

    current.set({
        id: entry.data.name,
        type: TabType.CODE,
        name: entry.data.shortName,
        entry: await readDetail(entry),
    });
};
