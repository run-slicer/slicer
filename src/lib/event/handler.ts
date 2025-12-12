import { disassembleEntry, type Disassembler } from "$lib/disasm";
import { tl } from "$lib/i18n";
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
    move as moveTab,
    open as openTab,
    openUnscoped as openUnscopedTab,
    remove as removeTab,
    type Tab,
    type TabDefinition,
    TabPosition,
    tabs,
    TabType,
    updatePane,
} from "$lib/tab";
import {
    add as addTask,
    create as createTask,
    phase as phaseTask,
    record,
    recordProgress,
    recordTimed,
    recordTimedProgress,
    remove as removeTask,
} from "$lib/task";
import { chunk, distribute, downloadBlob, humanSize, partition, readFiles, timestampFile, truncate } from "$lib/utils";
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
                toast.info(tl("toast.info.title.duplicate.single"), {
                    description: tl("toast.info.duplicate.single", result.entry.name),
                });
            }
        } else {
            // don't spam toasts for more than 5 entries
            toast.info(tl("toast.info.title.duplicate.multiple"), {
                description: tl("toast.info.duplicate.multiple", skipped.length),
            });
        }
    }
    if (created.length > 0) {
        toast.success(tl("toast.success.title.add"), {
            description: tl(
                created.length === 1 ? "toast.success.add.single" : "toast.success.add.multiple",
                created.length === 1 ? created[0].entry.name : created.length,
                time
            ),
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
                recordTimed("task.load", f.name, async () => {
                    try {
                        return await loadZip(f);
                    } catch (e) {
                        error(`failed to read zip ${f.name}`, e);
                        toast.error(tl("toast.error.title.generic"), {
                            description: tl("toast.error.load", f.name),
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
                    toast.info(tl("toast.info.title.duplicate.single"), {
                        description: tl("toast.info.duplicate.single", result.entry.name),
                    });
                }
            } else {
                // don't spam toasts for more than 5 entries
                toast.info(tl("toast.info.title.duplicate.multiple"), {
                    description: tl("toast.info.duplicate.multiple", skipped.length),
                });
            }
        }
        if (created.length > 0) {
            toast.success(tl("toast.success.title.load"), {
                description: tl(
                    created.length === 1 ? "toast.success.load.single" : "toast.success.load.multiple",
                    created.length,
                    time
                ),
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

        const results = await Promise.all(files.map((f) => recordTimed("task.add", f.name, () => loadFile(f))));

        const time = results.reduce((acc, v) => acc + v.time, 0);
        const [created, skipped] = partition(
            results.flatMap((r) => r.result),
            (r) => r.created
        );
        await toastAdd(created, skipped, time);
    },
    async addRemote(url: string): Promise<void> {
        const { time, result } = await recordTimedProgress("task.add", url, (task) => {
            return loadRemote(url, null, (loaded, total) => {
                if (total === -1) {
                    // total size unknown
                    task.desc.set(`${url} (${humanSize(loaded)})`);
                    task.progress = undefined; // indeterminate
                } else {
                    task.desc.set(`${url} (${humanSize(loaded)}/${humanSize(total)})`);
                    task.progress?.set((loaded / total) * 100);
                }
            });
        });

        const [created, skipped] = partition(result, (r) => r.created);
        await toastAdd(created, skipped, time);
    },
    async open(entry: Entry, tabType: TabType = detectTabType(entry)): Promise<void> {
        try {
            await openTab(entry, tabType);
        } catch (e) {
            toast.error(tl("toast.error.title.generic"), {
                description: tl("toast.error.open", entry.name),
            });
        }
    },
    openUnscoped(def: TabDefinition, position: TabPosition, move: boolean): void {
        const tab = openUnscopedTab(def, position);
        if (move) {
            moveTab(tab, position);
        }
        updatePane(tab.position, true);
    },
    async remove(entries: Entry[]): Promise<void> {
        const names = new Set(entries.map((e) => e.name));

        entries.forEach((e) => removeWs(e.name));
        for (const tab of get(tabs).values()) {
            if (tab.entry && names.has(tab.entry.name)) {
                removeTab(tab);
            }
        }

        toast.success(tl("toast.success.title.delete"), {
            description:
                entries.length === 1
                    ? tl("toast.success.delete.single", entries[0].name)
                    : tl("toast.success.delete.multiple", entries.length),
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

            return record("task.export", entry.name, async () => {
                try {
                    let entry0 = await readDeferred(entry);
                    if (entry.type === EntryType.CLASS && disasm) {
                        entry0 = await record("task.disasm", entry.name, () =>
                            disassembleEntry(entry as ClassEntry, disasm)
                        );
                    }

                    return downloadBlob(entry0.shortName, await entry0.data.blob());
                } catch (e) {
                    error(`failed to read entry ${entry.name}`, e);
                    toast.error(tl("toast.error.title.generic"), {
                        description: tl("toast.error.read", entry.name),
                    });
                }
            });
        }

        // evenly distribute classes for more efficient disassembly
        if (disasm) {
            const [classes, others] = partition(entries, (e) => e.type === EntryType.CLASS);
            entries = distribute(classes, others);
        }

        return recordProgress("task.export", null, async (exportTask) => {
            const channel = new Channel<Data>();
            const chunks = chunk(entries, Math.ceil(entries.length / (disasm?.concurrency ?? 1)));

            let count = 0;
            const promises = chunks.map(async (chunk) => {
                const task = addTask(createTask("task.read", null));

                for (let entry of chunk) {
                    entry = await readDeferred(entry);

                    const disassemble = disasm && entry.type === EntryType.CLASS;
                    task.desc.set(entry.name);
                    task.name.set(disassemble ? "task.disasm" : "task.read");

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

                    exportTask.desc.set(`${count}/${entries.length}`);
                    exportTask.progress?.set((count / entries.length) * 100);
                }

                removeTask(task, false);
            });

            Promise.all(promises).finally(() => channel.return());
            const blob = await download(channel, (data, e) => {
                error(`failed to read entry ${data.name}`, e);
                toast.error(tl("toast.error.title.generic"), {
                    description: tl("toast.error.read", data.name),
                });
            });

            exportTask.desc.set(`${entries.length}`);
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
                toast.error(tl("toast.error.title.generic"), {
                    description: tl("toast.error.clipboard.unsupported"),
                });
                return;
            }

            try {
                const data = await navigator.clipboard.readText();

                url = `data:text/javascript;base64,${window.btoa(data)}`;
            } catch (e) {
                toast.error(tl("toast.error.title.generic"), {
                    description: tl("toast.error.clipboard.denied"),
                });
                return;
            }
        }

        const proto = await record("task.script.import", truncate(url, 120), () => readScript(url));
        toast.success(tl("toast.success.import-script"), {
            description: tl("toast.success.import-script", proto.id),
        });

        if (load) {
            await loadScript(proto);
        }
    },
    loadScript,
    unloadScript,
    async removeScript(proto: ProtoScript): Promise<void> {
        await removeScript(proto);
        toast.success(tl("toast.success.title.delete"), {
            description: tl("toast.success.delete-script", proto.id),
        });
    },
} satisfies EventHandler;
