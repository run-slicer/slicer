import { type Entry, readDetail } from "$lib/workspace";
import { current, update, TabType, find } from "$lib/tab";
import { get } from "svelte/store";
import { tabIcon } from "$lib/components/icons";
import { toast } from "svelte-sonner";
import { error } from "$lib/logging";

export const open = async (entry: Entry, type: TabType = TabType.CODE) => {
    let tab = get(current);
    if (tab?.type === type && tab?.entry?.name === entry.name) {
        return; // already opened
    }

    const id = `${type}:${entry.name}`;

    tab = find(id);
    if (!tab) {
        // tab doesn't exist, create
        try {
            tab = update({
                id,
                type,
                name: entry.shortName,
                entry: await readDetail(entry),
                icon: tabIcon(type, entry.shortName),
            });
        } catch (e) {
            error(`failed to read entry ${entry.name}`, e);

            toast.error("Error occurred", {
                description: `Could not read ${entry.name}, check the console.`
            });
            return;
        }
    }

    current.set(tab);
};
