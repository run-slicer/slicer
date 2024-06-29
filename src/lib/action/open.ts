import { type Entry, current as currentWs, narrow } from "$lib/workspace";
import { get } from "svelte/store";

export const open = async (entry: Entry) => {
    if (get(currentWs)?.data?.name === entry.data.name) {
        return; // already opened
    }

    currentWs.set(await narrow(entry));
};
