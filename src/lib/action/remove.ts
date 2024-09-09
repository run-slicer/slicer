import { type Entry, remove as removeWs } from "$lib/workspace";
import { tabs, remove as removeTab } from "$lib/tab";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

export const remove = async (entries: Entry[]) => {
    const names = new Set(entries.map((e) => e.name));

    entries.forEach(removeWs);
    for (const tab of get(tabs).values()) {
        if (tab.entry && names.has(tab.entry.name)) {
            removeTab(tab.id);
        }
    }

    toast.success("Deleted", {
        description: `Deleted ${entries.length === 1 ? `entry ${entries[0].shortName}` : `${entries.length} entries`}.`,
    });
};
