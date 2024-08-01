import type { Member } from "@run-slicer/asm";
import type { Entry } from "$lib/workspace";
import { get, writable } from "svelte/store";
import type { StyledIcon } from "$lib/components/icons";
import { Sparkles } from "lucide-svelte";
import { writableDerived } from "$lib/store";

export const enum TabType {
    WELCOME = "welcome",
    CODE = "code",
    FLOW_GRAPH = "flow_graph",
}

export interface Tab {
    id: string;
    type: TabType;
    name: string;
    icon?: StyledIcon;
    entry?: Entry;
    member?: Member;
}

const welcomeTab: Tab = {
    id: `${TabType.WELCOME}:slicer`,
    type: TabType.WELCOME,
    name: "Welcome",
    icon: { icon: Sparkles, classes: ["text-muted-foreground"] },
};

export const tabs = writable<Map<string, Tab>>(new Map([[welcomeTab.id, welcomeTab]]));

export const orderedTabs = writableDerived<Map<string, Tab>, Tab[]>(
    tabs,
    (m) => Array.from(m.values()),
    (a) => new Map(a.map((e) => [e.id, e]))
);

export const current = writable<Tab | null>(welcomeTab);

// set window name based on currently opened tab
current.subscribe((tab) => {
    document.title = tab ? `${tab.name} - slicer` : "slicer";
});

export const update = (tab: Tab) => {
    tabs.update(($tabs) => {
        $tabs.set(tab.id, tab);
        return $tabs;
    });
};

export const remove = (id: string) => {
    const tab = get(current);
    if (tab?.id === id) {
        const all = get(orderedTabs);
        const nextTab = all.findIndex((t) => t.id === id) - 1;

        // open tab before the current one or close entirely if there's none
        current.set(nextTab < 0 ? null : all[nextTab]);
    }

    tabs.update(($tabs) => {
        $tabs.delete(id);
        return $tabs;
    });
};

export const clear = () => {
    tabs.update(($tabs) => {
        $tabs.clear();

        // reopen welcome tab
        $tabs.set(welcomeTab.id, welcomeTab);
        return $tabs;
    });

    current.set(welcomeTab);
};
