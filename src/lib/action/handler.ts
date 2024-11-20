import {
    type Action,
    ActionType,
    type BulkEntryAction,
    type EntryAction,
    type OpenAction,
    type ScriptAction,
    type ScriptAddAction,
    type TabAction,
} from "./";
import { clear as clearWs, type Entry, loadFile, loadZip, readDetail, remove as removeWs } from "$lib/workspace";
import { get } from "svelte/store";
import {
    clear as clearTabs,
    current as currentTab,
    updateCurrent as updateCurrentTab,
    find as findTab,
    remove as removeTab,
    type Tab,
    tabs,
    TabType,
    update as updateTab,
    detectType as detectTabType,
} from "$lib/tab";
import { toast } from "svelte-sonner";
import { downloadBlob, partition, readFiles, timed } from "$lib/utils";
import { tabIcon } from "$lib/components/icons";
import { loading } from "$lib/components/loader.svelte";
import { error } from "$lib/log";
import {
    read as readScript,
    load as loadScript,
    unload as unloadScript,
    remove as removeScript,
    type ProtoScript,
} from "$lib/script";
import { load as loadState, save as saveState, clear as clearState } from "$lib/state";

const load = async () => {
    const files = await readFiles(".jar,.zip", true);
    if (files.length === 0) {
        return;
    }

    await loading("Loading...", async () => {
        const results = await Promise.all(files.map((f) => timed(`load ${f.name}`, () => loadZip(f))));

        const time = results.reduce((acc, v) => acc + v.time, 0);
        const [created, skipped] = partition(
            results.flatMap((r) => r.result),
            (r) => r.created
        );
        if (skipped.length > 0) {
            if (skipped.length <= 5) {
                for (const result of skipped) {
                    toast.info("Duplicate entry", {
                        description: `Skipped adding ${result.entry.shortName}, as it is already present in the workspace.`,
                    });
                }
            } else {
                // don't spam toasts for more than 5 entries
                toast.info("Duplicate entries", {
                    description: `Skipped adding ${skipped.length} entries, as they were already present in the workspace.`,
                });
            }
        }
        if (created.length > 0) {
            toast.success("Loaded", {
                description: `Loaded ${created.length} ${created.length === 1 ? "entry" : "entries"} in ${time}ms.`,
            });
        }
    });
};

const add = async () => {
    const files = await readFiles("", true);
    if (files.length === 0) {
        return;
    }

    await loading("Loading...", async () => {
        const results = await Promise.all(files.map((f) => timed(`add ${f.name}`, () => loadFile(f))));

        const time = results.reduce((acc, v) => acc + v.time, 0);
        const [created, skipped] = partition(
            results.flatMap((r) => r.result),
            (r) => r.created
        );
        if (skipped.length > 0) {
            if (skipped.length <= 5) {
                for (const result of skipped) {
                    toast.info("Duplicate entry", {
                        description: `Skipped adding ${result.entry.name}, as it is already present in the workspace.`,
                    });
                }
            } else {
                // don't spam toasts for more than 5 entries
                toast.info("Duplicate entries", {
                    description: `Skipped adding ${skipped.length} entries, as they were already present in the workspace.`,
                });
            }
        }
        if (created.length > 0) {
            toast.success("Added", {
                description: `Added ${created.length} ${created.length === 1 ? "entry" : "entries"} in ${time}ms.`,
            });
        }
    });
};

const open = async (entry: Entry, type: TabType = detectTabType(entry)) => {
    let tab = get(currentTab);
    if (tab?.type === type && tab?.entry?.name === entry.name) {
        return; // already opened
    }

    const id = `${type}:${entry.name}`;

    tab = findTab(id);
    if (!tab) {
        // tab doesn't exist, create
        try {
            tab = updateTab({
                id,
                type,
                name: entry.shortName,
                entry: await readDetail(entry),
                icon: tabIcon(type, entry.shortName),
            });
        } catch (e) {
            error(`failed to read entry ${entry.name}`, e);

            toast.error("Error occurred", {
                description: `Could not read ${entry.name}, check the console.`,
            });
            return;
        }
    }

    updateCurrentTab(tab);
};

const remove = async (entries: Entry[]) => {
    const names = new Set(entries.map((e) => e.name));

    entries.forEach(removeWs);
    for (const tab of get(tabs).values()) {
        if (tab.entry && names.has(tab.entry.name)) {
            removeTab(tab.id);
        }
    }

    toast.success("Deleted", {
        description: `Deleted ${entries.length === 1 ? `entry ${entries[0].shortName}` : `${entries.length} entries`}.`,
    });
};

const export_ = async (entry: Entry | null = get(currentTab)?.entry || null) => {
    if (entry) {
        await downloadBlob(entry.shortName, await entry.data.blob());
    }
};

const clear = () => {
    clearWs();
    clearTabs();
};

const close = async (tab: Tab | null = get(currentTab)) => {
    if (tab) {
        removeTab(tab.id);
    }
};

const scriptAdd = async (url: string) => {
    const proto = await readScript(url);
    toast.success("Imported", {
        description: `Imported script ${proto.id}.`,
    });
};

const scriptLoad = loadScript;

const scriptUnload = unloadScript;

const scriptRemove = async (proto: ProtoScript) => {
    await removeScript(proto);
    toast.success("Deleted", {
        description: `Deleted script ${proto.id}.`,
    });
};

const prefsLoad = async () => {
    const files = await readFiles(".json", false);
    if (files.length > 0) {
        if (!loadState(await files[0].text())) {
            toast.error("Error occurred", {
                description: `Could not import preferences, check the console.`,
            });
        }
    }
};

export const prefsExport = async () => {
    await downloadBlob("slicer.json", new Blob([saveState()], { type: "application/json" }));
    toast.success("Exported", {
        description: `Preferences exported successfully.`,
    });
};

export const prefsClear = clearState;

export const handle = async (action: Action) => {
    const { type } = action;

    switch (type) {
        case ActionType.LOAD:
            return load();
        case ActionType.ADD:
            return add();
        case ActionType.CLEAR:
            return clear();
        case ActionType.OPEN: {
            const { entry, tabType } = action as OpenAction;
            return open(entry, tabType);
        }
        case ActionType.REMOVE: {
            const { entries } = action as BulkEntryAction;
            return remove(entries);
        }
        case ActionType.EXPORT: {
            const { entry } = action as EntryAction;
            return export_(entry);
        }
        case ActionType.CLOSE: {
            const { tab } = action as TabAction;
            return close(tab);
        }
        case ActionType.SCRIPT_ADD: {
            const { url } = action as ScriptAddAction;
            return scriptAdd(url);
        }
        case ActionType.SCRIPT_LOAD:
        case ActionType.SCRIPT_UNLOAD:
        case ActionType.SCRIPT_REMOVE: {
            const { proto } = action as ScriptAction;
            if (type === ActionType.SCRIPT_LOAD) return scriptLoad(proto);
            if (type === ActionType.SCRIPT_UNLOAD) return scriptUnload(proto);
            if (type === ActionType.SCRIPT_REMOVE) return scriptRemove(proto);

            return; // no-op
        }
        case ActionType.PREFS_LOAD:
            return prefsLoad();
        case ActionType.PREFS_EXPORT:
            return prefsExport();
        case ActionType.PREFS_CLEAR:
            return prefsClear();
    }
};
