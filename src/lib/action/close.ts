import { type Tab, current, remove } from "$lib/tab";
import { get } from "svelte/store";

export const close = async (tab: Tab | null = get(current)) => {
    if (tab) {
        remove(tab.id);
    }
};
