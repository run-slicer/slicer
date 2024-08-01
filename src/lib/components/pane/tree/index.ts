import type { Entry } from "$lib/workspace";
import { addToast } from "$lib/components/toaster.svelte";
import { open, remove, export_ } from "$lib/action";
import type { TabType } from "$lib/tab";

export interface Node {
    label: string;
    entry?: Entry;
    parent?: Node;
    nodes?: Node[];
    expanded?: boolean;
}

const deleteNode = (node: Node): number => {
    if (node.nodes) {
        return node.nodes.reduce((acc, v) => acc + deleteNode(v), 0);
    }

    if (node.entry) {
        remove(node.entry, true);
        return 1;
    }
    return 0;
};

export const openEntry = (data: Node, type: TabType) => open(data.entry!, type);

export const deleteEntry = (data: Node) => {
    if (data.nodes) {
        const num = deleteNode(data);

        addToast({
            title: "Deleted",
            description: `Deleted ${num} ${num !== 1 ? "entries" : "entry"}.`,
        });
    } else if (data.entry) {
        remove(data.entry);
    }
};

export const exportEntry = (data: Node) => export_(data.entry);
