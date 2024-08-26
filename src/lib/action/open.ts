import { type Entry, readDetail } from "$lib/workspace";
import { current, update, TabType, find } from "$lib/tab";
import { get } from "svelte/store";
import { tabIcon } from "$lib/components/icons";

export const open = async (entry: Entry, type: TabType = TabType.CODE) => {
    let tab = get(current);
    if (tab?.type === type && tab?.entry?.name === entry.name) {
        return; // already opened
    }

    const id = `${type}:${entry.name}`;

    tab = find(id);
    if (!tab) {
        // tab doesn't exist, create
        tab = update({
            id,
            type,
            name: entry.shortName,
            entry: await readDetail(entry),
            icon: tabIcon(type, entry.shortName),
        });
    }

    current.set(tab);
};
