import { toast } from "svelte-sonner";
import { read } from "$lib/script";
import { downloadBlob, readFiles } from "$lib/utils";
import { load as loadState, save as saveState } from "$lib/state";

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

export const loadPreferences = async () => {
    const files = await readFiles(".json", false);
    if (files.length > 0) {
        if (!loadState(await files[0].text())) {
            toast.error("Error occurred", {
                description: `Could not import preferences, check the console.`,
            });
        }
    }
};

export const savePreferences = async () => {
    await downloadBlob("slicer.json", new Blob([saveState()], { type: "application/json" }));
    toast.success("Exported", {
        description: `Preferences exported successfully.`,
    });
};
