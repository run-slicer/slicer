import type { Icon, StyledIcon } from "$lib/components/icons";
import { paneOpened, workspaceEncoding } from "$lib/state";
import { type Entry, EntryType } from "$lib/workspace";
import { Folders, Search, Sparkles, Terminal } from "lucide-svelte";
import { derived, get, writable } from "svelte/store";

export enum TabType {
    PROJECT = "project",
    LOGGING = "logging",
    SEARCH = "search",
    WELCOME = "welcome",
    CODE = "code",
    HEX = "hex",
    FLOW_GRAPH = "flow_graph",
    CLASS = "class",
    IMAGE = "image",
    HEAP_DUMP = "heap_dump",
}

export enum TabPosition {
    PRIMARY_CENTER = "primary_center",
    PRIMARY_BOTTOM = "primary_bottom",
    SECONDARY_LEFT = "secondary_left",
    SECONDARY_RIGHT = "secondary_right",
}

export interface Tab {
    id: string;
    type: TabType;
    name: string;
    position: TabPosition;
    active?: boolean;
    closeable: boolean;
    icon?: StyledIcon;
    entry?: Entry;

    dirty?: boolean;
    internalId?: any; // used for reactivity keying
}

export interface TabDefinition {
    type: TabType;
    name: string;
    icon: Icon;
}

// unscoped tab definitions
export const tabDefs: TabDefinition[] = [
    {
        type: TabType.PROJECT,
        name: "Project",
        icon: Folders,
    },
    {
        type: TabType.LOGGING,
        name: "Logging",
        icon: Terminal,
    },
    {
        type: TabType.WELCOME,
        name: "Welcome",
        icon: Sparkles,
    },
    {
        type: TabType.SEARCH,
        name: "Search",
        icon: Search,
    },
];

const typedDefs = new Map(tabDefs.map((d) => [d.type, d]));

export const tabs = writable<Map<string, Tab>>(
    new Map(
        get(paneOpened)
            .map((pane) => ({ pane, def: typedDefs.get(pane.type)! }))
            .map(({ pane, def }) => [
                `${def.type}:slicer`,
                {
                    id: `${def.type}:slicer`,
                    type: def.type,
                    name: def.name,
                    position: pane.position,
                    active: pane.active,
                    closeable: true,
                    icon: { icon: def.icon, classes: ["text-muted-foreground"] },
                    internalId: {},
                },
            ])
    )
);

// save opened unscoped tabs' position for returning sessions
tabs.subscribe(($tabs) => {
    const candidates = Array.from($tabs.values())
        .filter((t) => typedDefs.has(t.type))
        .map((t) => ({ type: t.type, position: t.position, active: Boolean(t.active) }));

    // re-add Welcome tab, if not present
    if (!candidates.some((t) => t.type === TabType.WELCOME)) {
        candidates.unshift({ type: TabType.WELCOME, position: TabPosition.PRIMARY_CENTER, active: false });
    }

    for (const pos of Object.values(TabPosition)) {
        const posCan = candidates.filter((t) => t.position === pos);
        if (posCan.length > 0 && !posCan.some((t) => t.active)) {
            // no active tab for position, make the last one active
            posCan[posCan.length - 1]!.active = true;
        }
    }

    paneOpened.set(candidates);
});

export const current = derived(tabs, ($tabs) => {
    return Array.from($tabs.values()).find((t) => t.active && t.position === TabPosition.PRIMARY_CENTER) || null;
});

// set window name based on currently opened tab
current.subscribe(($current) => {
    // PWAs don't need the app name reiterated
    if (window.matchMedia("not (display-mode: browser)").matches) {
        document.title = $current ? $current.name : "slicer";
    } else {
        document.title = $current ? `${$current.name} | slicer` : "slicer";
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

    tabs.update(($tabs) => {
        for (const tab0 of $tabs.values()) {
            if (tab0.id === tab?.id) {
                tab0.position = position;
                tab0.active = true;
            } else if (tab0.active && tab0.position === position) {
                tab0.active = false;
            }
        }

        return $tabs;
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
    if (tab.active) {
        return refreshImmediately(tab);
    }

    tab.dirty = true;
    return tab;
};

// gets the preceding tab or null if there's only one in position
const nextTab = (tab: Tab): Tab | null => {
    const all = Array.from(get(tabs).values()).filter((t) => t.position === tab.position);
    const tabIndex = all.findIndex((t) => t.id === tab.id);
    const nextTab = all.length > 1 ? (tabIndex > 0 ? tabIndex - 1 : all.length - 1) : -1;

    return nextTab < 0 ? null : all[nextTab];
};

export const remove = (tab: Tab) => {
    updateCurrent(tab.position, nextTab(tab));

    tabs.update(($tabs) => {
        $tabs.delete(tab.id);
        return $tabs;
    });
};

export const move = (tab: Tab, position: TabPosition) => {
    if (tab.position === position) return;
    if (tab.active) {
        updateCurrent(tab.position, nextTab(tab));
    }

    tab.active = true;
    tab.position = position;

    tabs.update(($tabs) => {
        // deactivate clashing tabs
        for (const tab0 of $tabs.values()) {
            if (tab0.id !== tab.id && tab0.position === position) {
                tab0.active = false;
            }
        }

        return $tabs;
    });
};

export const clear = () => {
    tabs.update(($tabs) => {
        for (const tab of $tabs.values()) {
            if (tab.entry) {
                $tabs.delete(tab.id);
            }
        }

        return $tabs;
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
