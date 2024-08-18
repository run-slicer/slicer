import Menu from "./menu.svelte";
import { addToast } from "$lib/components/toaster.svelte";
import { current as currentTab, TabType } from "$lib/tab";
import { get } from "svelte/store";
import { open } from "$lib/action";
import { read } from "$lib/script";

export const openEntry = async (type: TabType) => {
    const entry = get(currentTab)?.entry || null;
    if (entry) {
        await open(entry, type);
    }
};

export const loadClipboardScript = async () => {
    if (!navigator.clipboard) {
        addToast({
            title: "Error occurred",
            description: `Could not copy from clipboard, feature not available.`,
            variant: "destructive",
        });
        return;
    }

    try {
        const data = await navigator.clipboard.readText();
        const proto = await read(`data:text/javascript;base64,${window.btoa(data)}`);

        addToast({
            title: "Imported",
            description: `Imported script ${proto.id}.`,
        });
    } catch (e) {
        addToast({
            title: "Error occurred",
            description: `Could not copy from clipboard, access denied.`,
            variant: "destructive",
        });
    }
};

export { Menu };
