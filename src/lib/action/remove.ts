import { type Entry, remove as removeWs } from "$lib/workspace";
import { tabs, remove as removeTab } from "$lib/tab";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

export const remove = (entry: Entry, silent: boolean = false) => {
    removeWs(entry);
    for (const tab of get(tabs).values()) {
        if (tab.entry?.name === entry.name) {
            removeTab(tab.id);
        }
    }

    if (!silent) {
        toast.success("Deleted", {
            description: `Deleted entry ${entry.shortName}.`,
        });
    }
};
