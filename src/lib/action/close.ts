import { current as currentWs } from "$lib/workspace";
import { remove as removeTab } from "$lib/tab";
import { get } from "svelte/store";

export const close = async () => {
    const entry = get(currentWs);
    if (entry) {
        removeTab(entry.data.name);
    }

    currentWs.set(null);
};
