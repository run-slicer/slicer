import { current, remove } from "$lib/tab";
import { get } from "svelte/store";

export const close = async () => {
    const tab = get(current);
    if (tab) {
        remove(tab.id);
    }
};
