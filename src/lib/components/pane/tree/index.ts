import type { Entry } from "$lib/workspace";
import TreePane from "./tree.svelte";

export interface Node {
    label: string;
    entry?: Entry;
    parent?: Node;
    nodes?: Node[];
    expanded?: boolean;
}

export { TreePane };
