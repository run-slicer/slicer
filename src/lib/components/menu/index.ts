import Menu from "./menu.svelte";
import { toast } from "svelte-sonner";
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
        toast.error("Error occurred", {
            description: `Could not copy from clipboard, feature not available.`,
        });
        return;
    }

    try {
        const data = await navigator.clipboard.readText();
        const proto = await read(`data:text/javascript;base64,${window.btoa(data)}`);

        toast.success("Imported", {
            description: `Imported script ${proto.id}.`,
        });
    } catch (e) {
        toast.error("Error occurred", {
            description: `Could not copy from clipboard, access denied.`,
        });
    }
};

export { Menu };
