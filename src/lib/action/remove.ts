import { type Entry, remove as removeWs } from "$lib/workspace";
import { remove as removeTab } from "$lib/tab";
import { addToast } from "$lib/components/toaster.svelte";

export const remove = (entry: Entry, silent: boolean = false) => {
    removeWs(entry);
    removeTab(entry.data.name);

    if (!silent) {
        addToast({
            title: "Deleted",
            description: `Deleted entry ${entry.data.shortName}.`,
        });
    }
};
