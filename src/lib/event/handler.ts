import { disassembleEntry, type Disassembler } from "$lib/disasm";
import { error } from "$lib/log";
import {
    load as loadScript,
    type ProtoScript,
    read as readScript,
    remove as removeScript,
    unload as unloadScript,
} from "$lib/script";
import {
    clear as clearTabs,
    current as currentTab,
    detectType as detectTabType,
    open as openTab,
    openUnscoped as openUnscopedTab,
    remove as removeTab,
    type Tab,
    type TabDefinition,
    TabPosition,
    tabs,
    TabType,
} from "$lib/tab";
import {
    add as addTask,
    create as createTask,
    phase as phaseTask,
    record,
    recordProgress,
    recordTimed,
    remove as removeTask,
} from "$lib/task";
import { chunk, distribute, downloadBlob, partition, readFiles, timestampFile, truncate } from "$lib/utils";
import {
    type ClassEntry,
    clear as clearWs,
    type Entry,
    EntryType,
    loadFile,
    loadRemote,
    type LoadResult,
    loadZip,
    readDeferred,
    remove as removeWs,
    ZIP_EXTENSIONS,
} from "$lib/workspace";
import { type Data, download } from "$lib/workspace/data";
import { Channel } from "queueable";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";
import type { EventHandler } from "./";

// one hell of a file that responds to basically all essential actions as signalled by the UI

const toastAdd = async (created: LoadResult[], skipped: LoadResult[], time: number): Promise<void> => {
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
};

export default {
    async load(): Promise<void> {
        const files = await readFiles(
            Array.from(ZIP_EXTENSIONS.values())
                .map((e) => `.${e}`)
                .join(","),
            true
        );
        if (files.length === 0) {
            return;
        }

        const results = await Promise.all(
            files.map((f) =>
                recordTimed("loading", f.name, async () => {
                    try {
                        return await loadZip(f);
                    } catch (e) {
                        error(`failed to read zip ${f.name}`, e);
                        toast.error("Error occurred", {
                            description: `Could not read ZIP ${f.name}, check the console.`,
                        });
                    }

                    return [];
                })
            )
        );

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
    },
    async add(files?: File[]): Promise<void> {
        if (!files) {
            files = await readFiles("", true);
        }

        if (files.length === 0) {
            return;
        }

        const results = await Promise.all(files.map((f) => recordTimed("adding", f.name, () => loadFile(f))));

        const time = results.reduce((acc, v) => acc + v.time, 0);
        const [created, skipped] = partition(
            results.flatMap((r) => r.result),
            (r) => r.created
        );
        await toastAdd(created, skipped, time);
    },
    async addRemote(url: string): Promise<void> {
        const { time, result } = await recordTimed("adding", url, () => loadRemote(url));

        const [created, skipped] = partition(result, (r) => r.created);
        await toastAdd(created, skipped, time);
    },
    async open(entry: Entry, tabType: TabType = detectTabType(entry)): Promise<void> {
        try {
            await openTab(entry, tabType);
        } catch (e) {
            toast.error("Error occurred", {
                description: `Could not read ${entry.name}, check the console.`,
            });
        }
    },
    openUnscoped(def: TabDefinition, position: TabPosition): void {
        openUnscopedTab(def, position);
    },
    async remove(entries: Entry[]): Promise<void> {
        const names = new Set(entries.map((e) => e.name));

        entries.forEach((e) => removeWs(e.name));
        for (const tab of get(tabs).values()) {
            if (tab.entry && names.has(tab.entry.name)) {
                removeTab(tab);
            }
        }

        toast.success("Deleted", {
            description: `Deleted ${entries.length === 1 ? `entry ${entries[0].shortName}` : `${entries.length} entries`}.`,
        });
    },
    async export(entries?: Entry[], disasm?: Disassembler): Promise<void> {
        if (!entries) {
            const entry = get(currentTab)?.entry;
            if (!entry) {
                return;
            }

            entries = [entry];
        }

        if (entries.length === 1) {
            const entry = entries[0];

            return record("exporting", entry.name, async () => {
                try {
                    let entry0 = await readDeferred(entry);
                    if (entry.type === EntryType.CLASS && disasm) {
                        entry0 = await record("disassembling", entry.name, () =>
                            disassembleEntry(entry as ClassEntry, disasm)
                        );
                    }

                    return downloadBlob(entry0.shortName, await entry0.data.blob());
                } catch (e) {
                    error(`failed to read entry ${entry.name}`, e);
                    toast.error("Error occurred", {
                        description: `Could not read entry ${entry.name}, check the console.`,
                    });
                }
            });
        }

        // evenly distribute classes for more efficient disassembly
        if (disasm) {
            const [classes, others] = partition(entries, (e) => e.type === EntryType.CLASS);
            entries = distribute(classes, others);
        }

        return recordProgress("exporting", `${entries.length} entries`, async (exportTask) => {
            const channel = new Channel<Data>();
            const chunks = chunk(entries, Math.ceil(entries.length / (disasm?.concurrency || 1)));

            let count = 0;
            const promises = chunks.map(async (chunk) => {
                const task = addTask(createTask("reading", null));

                for (let entry of chunk) {
                    entry = await readDeferred(entry);

                    const disassemble = disasm && entry.type === EntryType.CLASS;
                    task.desc.set(entry.name);
                    task.name.set(disassemble ? "disassembling" : "reading");

                    if (disassemble) {
                        entry = await disassembleEntry(entry as ClassEntry, disasm);
                    }

                    // finished with entry
                    count++;
                    phaseTask(task);

                    // exclude archives that have been expanded
                    if (entry.type !== EntryType.ARCHIVE || !entries.some((e) => e.parent === entry)) {
                        channel.push({ ...entry.data, name: entry.name }).then(); // we don't care about the result
                    }

                    exportTask.desc.set(`${entries.length} entries (${entries.length - count} remaining)`);
                    exportTask.progress?.set((count / entries.length) * 100);
                }

                removeTask(task, false);
            });

            Promise.all(promises).finally(() => channel.return());
            const blob = await download(channel, (data, e) => {
                error(`failed to read entry ${data.name}`, e);
                toast.error("Error occurred", {
                    description: `Could not read entry ${data.name}, check the console.`,
                });
            });

            exportTask.desc.set(`${entries.length} entries`);
            return downloadBlob(`export-${disasm?.id || "raw"}-${timestampFile()}.zip`, blob);
        });
    },
    clear(): void {
        clearWs();
        clearTabs();
    },
    close(tab: Tab | undefined = get(currentTab) ?? undefined): void {
        if (tab) {
            removeTab(tab);
        }
    },
    async addScript(url?: string, load?: boolean): Promise<void> {
        if (!url) {
            if (!navigator.clipboard) {
                toast.error("Error occurred", {
                    description: `Could not copy from clipboard, feature not available.`,
                });
                return;
            }

            try {
                const data = await navigator.clipboard.readText();

                url = `data:text/javascript;base64,${window.btoa(data)}`;
            } catch (e) {
                toast.error("Error occurred", {
                    description: `Could not copy from clipboard, access denied.`,
                });
                return;
            }
        }

        const proto = await record("importing script", truncate(url, 120), () => readScript(url));
        toast.success("Imported", {
            description: `Imported script ${proto.id}.`,
        });

        if (load) {
            await loadScript(proto);
        }
    },
    loadScript,
    unloadScript,
    async removeScript(proto: ProtoScript): Promise<void> {
        await removeScript(proto);
        toast.success("Deleted", {
            description: `Deleted script ${proto.id}.`,
        });
    },
} satisfies EventHandler;
