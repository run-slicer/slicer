import type { Entry } from "$lib/workspace";
import { TabType } from "$lib/tab";
import TreePane from "./tree.svelte";

export interface Node {
    label: string;
    entry?: Entry;
    parent?: Node;
    nodes?: Node[];
    expanded?: boolean;
}

export interface Action {
    type: "load" | "open" | "delete" | "download";
    data?: Node;
    tabType?: TabType;
}

/*const deleteNode = (node: Node): number => {
    if (node.nodes) {
        return node.nodes.reduce((acc, v) => acc + deleteNode(v), 0);
    }

    if (node.entry) {
        remove(node.entry, true);
        return 1;
    }
    return 0;
};

// prettier-ignore
const binaryExtensions = new Set([
    "bin", "tar", "gz", "rar", "zip", "7z", "jar", "jpg", "jpeg", "gif", "png", "lzma", "dll", "so", "dylib", "exe",
    "kotlin_builtins", "kotlin_metadata", "kotlin_module", "nbt", "ogg", "cer", "der", "crt",
]);

const detectTabType = (entry: Entry): TabType => {
    return entry.extension && binaryExtensions.has(entry.extension) ? TabType.HEX : TabType.CODE;
};

export const openEntry = (data: Node, type?: TabType) => open(data.entry!, type || detectTabType(data.entry!));

export const deleteEntry = (data: Node) => {
    if (data.nodes) {
        const num = deleteNode(data);

        toast.success("Deleted", {
            description: `Deleted ${num} ${num !== 1 ? "entries" : "entry"}.`,
        });
    } else if (data.entry) {
        remove(data.entry);
    }
};

export const exportEntry = (data: Node) => export_(data.entry);*/

export { TreePane };
