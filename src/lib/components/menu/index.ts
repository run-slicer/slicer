import Menu from "./menu.svelte";
import { current as currentTab, TabType } from "$lib/tab";
import { get } from "svelte/store";
import { open } from "$lib/action";

export const openEntry = async (type: TabType) => {
    const entry = get(currentTab)?.entry || null;
    if (entry) {
        await open(entry, type);
    }
};

export { Menu };
