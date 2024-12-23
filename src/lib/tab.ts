import type { StyledIcon } from "$lib/components/icons";
import { workspaceEncoding } from "$lib/state";
import { type Entry, EntryType } from "$lib/workspace";
import { Sparkles } from "lucide-svelte";
import { get, writable } from "svelte/store";

export const enum TabType {
    WELCOME = "welcome",
    CODE = "code",
    HEX = "hex",
    FLOW_GRAPH = "flow_graph",
    CLASS = "class",
    IMAGE = "image",
    HEAP_DUMP = "heap_dump",
}

export interface Tab {
    id: string;
    type: TabType;
    name: string;
    icon?: StyledIcon;
    entry?: Entry;

    dirty?: boolean;
    internalId?: any; // used for reactivity keying
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
    // PWAs don't need the app name reiterated
    if (window.matchMedia("not (display-mode: browser)").matches) {
        document.title = tab ? tab.name : "slicer";
    } else {
        document.title = tab ? `${tab.name} | slicer` : "slicer";
    }
});

const refreshImmediately = (tab: Tab): Tab => {
    tab.internalId = undefined;
    tab.dirty = false;

    return update(tab);
};

// helper function for making sure a tab is refreshed before it's made active
export const updateCurrent = (tab: Tab | null) => {
    current.set(tab?.dirty ? refreshImmediately(tab) : tab);
};

export const find = (id: string): Tab | null => {
    return get(tabs).get(id) || null;
};

export const update = (tab: Tab): Tab => {
    if (!tab.internalId) {
        tab.internalId = {}; // fill in missing id
    }

    tabs.update(($tabs) => {
        $tabs.set(tab.id, tab);
        return $tabs;
    });
    return tab;
};

export const refresh = (tab: Tab): Tab => {
    // try immediate update for the current tab
    if (get(current)?.id === tab.id) {
        return refreshImmediately(tab);
    }

    tab.dirty = true;
    return tab;
};

export const remove = (id: string) => {
    const tab = get(current);
    if (tab?.id === id) {
        const all = Array.from(get(tabs).values());
        const nextTab = all.findIndex((t) => t.id === id) - 1;

        // open tab before the current one or close entirely if there's none
        updateCurrent(nextTab < 0 ? null : all[nextTab]);
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

// prettier-ignore
const extensions = {
    [TabType.HEX]: [
        "bin", "tar", "gz", "rar", "zip", "7z", "jar", "lzma", "dll", "so", "dylib", "exe", "kotlin_builtins",
        "kotlin_metadata", "kotlin_module", "nbt", "ogg", "cer", "der", "crt",
    ],
    [TabType.IMAGE]: ["jpg", "jpeg", "gif", "png", "webp"],
    [TabType.HEAP_DUMP]: ["hprof"],
};

const typesByExts = new Map(
    (Object.entries(extensions) as [TabType, string[]][]).flatMap(([k, v]) => v.map((ext) => [ext, k]))
);

export const detectType = (entry: Entry): TabType => {
    return entry.extension ? typesByExts.get(entry.extension) || TabType.CODE : TabType.CODE;
};

export const isEncodingDependent = (tab: Tab): boolean => {
    return tab.type === TabType.CODE && tab.entry?.type !== EntryType.CLASS /* not disassembled */;
};

// soft-refresh code tabs on encoding change
workspaceEncoding.subscribe(() => {
    for (const tab of get(tabs).values()) {
        if (isEncodingDependent(tab)) {
            refresh(tab);
        }
    }
});
