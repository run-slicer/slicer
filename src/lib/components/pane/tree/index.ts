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

export { TreePane };
