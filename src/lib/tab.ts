import { type Icon, type StyledIcon, tabIcon } from "$lib/components/icons";
import { error } from "$lib/log";
import { panes, workspaceEncoding } from "$lib/state";
import { type Entry, EntryType, readDeferred } from "$lib/workspace";
import { Box, Folders, ScrollText, Search, Sparkles } from "lucide-svelte";
import { derived, get, writable } from "svelte/store";

export enum TabType {
    PROJECT = "project",
    LOGGING = "logging",
    PLAYGROUND = "playground",
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
        icon: ScrollText,
    },
    {
        type: TabType.WELCOME,
        name: "Welcome",
        icon: Sparkles,
    },
    {
        type: TabType.PLAYGROUND,
        name: "Playground",
        icon: Box,
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
        get(panes)
            .flatMap(({ position, tabs }) => tabs.map((tab) => ({ position, tab, def: typedDefs.get(tab.type) })))
            .filter(({ def }) => def !== undefined)
            .map(({ position, tab, def }) => [
                `${def!.type}:slicer`,
                {
                    id: `${def!.type}:slicer`,
                    type: def!.type,
                    name: def!.name,
                    position,
                    active: tab.active,
                    closeable: true,
                    icon: { icon: def!.icon, classes: ["text-muted-foreground"] },
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

    panes.update(($panes) => {
        return Object.values(TabPosition).map((pos) => {
            const data = $panes.find((p) => p.position === pos) || { position: pos, tabs: [], open: false };
            data.tabs = candidates.filter((t) => t.position === pos).map(({ type, active }) => ({ type, active }));

            if (data.tabs.length > 0 && !data.tabs.some((t) => t.active)) {
                // no active tab for position, make the last one active
                data.tabs[data.tabs.length - 1]!.active = true;
            }
            return data;
        });
    });
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

// utilities below

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

export const open = async (entry: Entry, type: TabType = detectType(entry)): Promise<Tab> => {
    if (entry.type === EntryType.MEMBER && type === TabType.CLASS) {
        entry = entry.parent!; // unwrap to parent class
    }

    const id = `${type}:${entry.name}`;

    let tab = find(id);
    if (!tab) {
        // tab doesn't exist, create
        try {
            tab = update({
                id,
                type,
                name: entry.shortName,
                position: TabPosition.PRIMARY_CENTER,
                closeable: true,
                entry: await readDeferred(entry),
                icon: tabIcon(type, entry),
            });
        } catch (e) {
            error(`failed to read entry ${entry.name}`, e);

            throw e; // rethrow
        }
    }

    updateCurrent(tab.position, tab);
    return tab;
};

export const openUnscoped = (def: TabDefinition, position: TabPosition): Tab => {
    let tab = Array.from(get(tabs).values()).find((t) => t.type === def.type);

    if (tab) {
        move(tab, position);
    } else {
        tab = update({
            id: `${def.type}:slicer`,
            type: def.type,
            name: def.name,
            position,
            closeable: true,
            icon: { icon: def.icon, classes: ["text-muted-foreground"] },
        });

        updateCurrent(tab.position, tab);
    }

    return tab;
};
