import { type Entry, remove as removeWs } from "$lib/workspace";
import { addToast } from "$lib/components/toaster.svelte";

export const remove = (entry: Entry) => {
    removeWs(entry);

    addToast({
        title: "Deleted",
        description: `Deleted entry ${entry.data.shortName}.`,
    });
};
