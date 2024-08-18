import type { Entry } from "$lib/workspace";
import { get, writable } from "svelte/store";
import type { StyledIcon } from "$lib/components/icons";
import { Sparkles } from "lucide-svelte";

export const enum TabType {
    WELCOME = "welcome",
    CODE = "code",
    HEX = "hex",
    FLOW_GRAPH = "flow_graph",
}

export interface Tab {
    id: string;
    type: TabType;
    name: string;
    icon?: StyledIcon;
    entry?: Entry;
}

const welcomeTab: Tab = {
    id: `${TabType.WELCOME}:slicer`,
    type: TabType.WELCOME,
    name: "Welcome",
    icon: { icon: Sparkles, classes: ["text-muted-foreground"] },
};

export const tabs = writable<Map<string, Tab>>(new Map([[welcomeTab.id, welcomeTab]]));

export const current = writable<Tab | null>(welcomeTab);

// set window name based on currently opened tab
current.subscribe((tab) => {
    document.title = tab ? `${tab.name} - slicer` : "slicer";
});

export const find = (id: string): Tab | null => {
    return get(tabs).get(id) || null;
};

export const update = (tab: Tab): Tab => {
    tabs.update(($tabs) => {
        $tabs.set(tab.id, tab);
        return $tabs;
    });
    return tab;
};

export const remove = (id: string) => {
    const tab = get(current);
    if (tab?.id === id) {
        const all = Array.from(get(tabs).values());
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
