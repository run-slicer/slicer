import { type Entry, remove as removeWs } from "$lib/workspace";
import { remove as removeTab } from "$lib/tab";
import { toast } from "svelte-sonner";

export const remove = (entry: Entry, silent: boolean = false) => {
    removeWs(entry);
    removeTab(entry.data.name);

    if (!silent) {
        toast.success("Deleted", {
            description: `Deleted entry ${entry.data.shortName}.`,
        });
    }
};
