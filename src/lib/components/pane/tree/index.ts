import { type Entry, remove as removeWs } from "$lib/workspace";
import { addToast } from "$lib/components/toaster.svelte";
import { remove } from "$lib/action/remove";
import { open } from "$lib/action/open";

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
        removeWs(node.entry);
        return 1;
    }
    return 0;
};

export const openEntry = (data: Node) => open(data.entry!);

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
