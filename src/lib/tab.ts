import type { StyledIcon } from "$lib/components/icons";
import { workspaceEncoding } from "$lib/state";
import { type Entry, EntryType } from "$lib/workspace";
import { Folders, Sparkles } from "lucide-svelte";
import { derived, get, writable } from "svelte/store";

export const enum TabType {
    PROJECT = "project",
    LOGGING = "logging",
    WELCOME = "welcome",
    CODE = "code",
    HEX = "hex",
    FLOW_GRAPH = "flow_graph",
    CLASS = "class",
    IMAGE = "image",
    HEAP_DUMP = "heap_dump",
}

export const enum TabPosition {
    PRIMARY_TOP,
    PRIMARY_CENTER,
    PRIMARY_BOTTOM,
    SECONDARY_LEFT,
    SECONDARY_RIGHT,
}

export interface Tab {
    id: string;
    type: TabType;
    name: string;
    position: TabPosition;
    closeable: boolean;
    icon?: StyledIcon;
    entry?: Entry;

    dirty?: boolean;
    internalId?: any; // used for reactivity keying
}

const welcomeTab: Tab = {
    id: `${TabType.WELCOME}:slicer`,
    type: TabType.WELCOME,
    name: "Welcome",
    position: TabPosition.PRIMARY_CENTER,
    closeable: true,
    icon: { icon: Sparkles, classes: ["text-muted-foreground"] },
    internalId: {},
};

const projectTab: Tab = {
    id: `${TabType.PROJECT}:slicer`,
    type: TabType.PROJECT,
    name: "Project",
    position: TabPosition.SECONDARY_LEFT,
    closeable: false,
    icon: { icon: Folders, classes: ["text-muted-foreground"] },
    internalId: {},
};

export const tabs = writable<Map<string, Tab>>(
    new Map([
        [projectTab.id, projectTab],
        [welcomeTab.id, welcomeTab],
    ])
);

export const current = writable<Map<TabPosition, Tab>>(
    new Map([
        [TabPosition.PRIMARY_CENTER, welcomeTab],
        [TabPosition.SECONDARY_LEFT, projectTab],
    ])
);

export const currentPrimary = derived(current, ($current) => {
    return $current.get(TabPosition.PRIMARY_CENTER) || null;
});

// set window name based on currently opened tab
currentPrimary.subscribe(($currentPrimary) => {
    // PWAs don't need the app name reiterated
    if (window.matchMedia("not (display-mode: browser)").matches) {
        document.title = $currentPrimary ? $currentPrimary.name : "slicer";
    } else {
        document.title = $currentPrimary ? `${$currentPrimary.name} | slicer` : "slicer";
    }
});

const refreshImmediately = (tab: Tab): Tab => {
    tab.internalId = undefined;
    tab.dirty = false;

    return update(tab);
};

// helper function for making sure a tab is refreshed before it's made active
export const updateCurrent = (position: TabPosition, tab: Tab | null) => {
    if (tab?.dirty) {
        tab = refreshImmediately(tab);
    }

    current.update(($current) => {
        if (tab) {
            $current.set(position, tab);
        } else {
            $current.delete(position);
        }
        return $current;
    });
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
    if (get(current).get(tab.position)?.id === tab.id) {
        return refreshImmediately(tab);
    }

    tab.dirty = true;
    return tab;
};

// gets the preceding tab or null if there's only one in position
const nextTab = (tab: Tab): Tab | null => {
    const all = Array.from(
        get(tabs)
            .values()
            .filter((t) => t.position === tab.position)
    );
    const nextTab = all.findIndex((t) => t.id === tab.id) - 1;

    return nextTab < 0 ? null : all[nextTab];
};

export const remove = (id: string) => {
    const tab = get(current)
        .values()
        .find((t) => t.id === id);

    if (tab) {
        updateCurrent(tab.position, nextTab(tab));
    }

    tabs.update(($tabs) => {
        $tabs.delete(id);
        return $tabs;
    });
};

export const move = (tab: Tab, position: TabPosition) => {
    const oldPos = tab.position;
    if (oldPos === position) return;

    let next = nextTab(tab);

    tab.position = position;
    tabs.update(($tabs) => $tabs);

    current.update(($current) => {
        if ($current.values().some((t) => t.id === tab.id)) {
            if (next) {
                if (next.dirty) {
                    next = refreshImmediately(next);
                }

                $current.set(oldPos, next);
            } else {
                $current.delete(oldPos);
            }
        }

        $current.set(position, tab);
        return $current;
    });
};

export const clear = () => {
    tabs.update(($tabs) => {
        for (const tab of $tabs.values()) {
            if (tab.closeable) {
                $tabs.delete(tab.id);
            }
        }

        // reopen welcome tab
        $tabs.set(welcomeTab.id, welcomeTab);
        return $tabs;
    });

    current.update(($current) => {
        $current.clear();

        welcomeTab.position = TabPosition.PRIMARY_CENTER;
        $current.set(TabPosition.PRIMARY_CENTER, welcomeTab);
        projectTab.position = TabPosition.SECONDARY_LEFT;
        $current.set(TabPosition.SECONDARY_LEFT, projectTab);

        return $current;
    });
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
