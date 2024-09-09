import { type Entry, readDetail } from "$lib/workspace";
import { current, update, TabType, find } from "$lib/tab";
import { get } from "svelte/store";
import { tabIcon } from "$lib/components/icons";
import { toast } from "svelte-sonner";
import { error } from "$lib/log";

// prettier-ignore
const binaryExtensions = new Set([
    "bin", "tar", "gz", "rar", "zip", "7z", "jar", "jpg", "jpeg", "gif", "png", "lzma", "dll", "so", "dylib", "exe",
    "kotlin_builtins", "kotlin_metadata", "kotlin_module", "nbt", "ogg", "cer", "der", "crt",
]);

const detectTabType = (entry: Entry): TabType => {
    return entry.extension && binaryExtensions.has(entry.extension) ? TabType.HEX : TabType.CODE;
};

export const open = async (entry: Entry, type?: TabType) => {
    if (!type) {
        type = detectTabType(entry);
    }

    let tab = get(current);
    if (tab?.type === type && tab?.entry?.name === entry.name) {
        return; // already opened
    }

    const id = `${type}:${entry.name}`;

    tab = find(id);
    if (!tab) {
        // tab doesn't exist, create
        try {
            tab = update({
                id,
                type,
                name: entry.shortName,
                entry: await readDetail(entry),
                icon: tabIcon(type, entry.shortName),
            });
        } catch (e) {
            error(`failed to read entry ${entry.name}`, e);

            toast.error("Error occurred", {
                description: `Could not read ${entry.name}, check the console.`,
            });
            return;
        }
    }

    current.set(tab);
};
