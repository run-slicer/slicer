import { error } from "$lib/log";
import { analysisBackground } from "$lib/state";
import { recordProgress } from "$lib/task";
import { FLAG_SKIP_ATTR } from "@run-slicer/asm";
import { wrap } from "comlink";
import { get } from "svelte/store";
import { type ClassEntry, type Entry, EntryType } from "../";
import type { Worker as AnalysisWorker } from "./worker";
import Worker from "./worker?worker";

const canAnalyze = (entry: Entry): boolean => {
    return entry.type === EntryType.FILE && entry.extension === "class";
};

const worker = wrap<AnalysisWorker>(new Worker());
export const analyze = async (entry: Entry) => {
    switch (entry.extension) {
        case "class": {
            // try to read as class
            const buffer = await entry.data.bytes();

            try {
                const classEntry = entry as ClassEntry;

                classEntry.node = await worker.read(buffer, FLAG_SKIP_ATTR);
                classEntry.full = false;
                classEntry.type = EntryType.CLASS;
            } catch (e) {
                error(`failed to read class ${entry.name}`, e);
            }
        }
    }
};

let queue: Entry[] = [];

export const schedule = (entry: Entry) => queue.push(entry);

export const analyzeBackground = async () => {
    // snapshot queue
    const $queue = queue.filter(canAnalyze);
    queue = [];

    if (!get(analysisBackground) || $queue.length === 0) return;

    await recordProgress("analyzing", null, async (task) => {
        for (let i = 0; i < $queue.length; i++) {
            await analyze($queue[i]);

            task.desc.set(`${$queue.length} entries (${$queue.length - i - 1} remaining)`);
            task.progress?.set(((i + 1) / $queue.length) * 100);
        }

        task.desc.set(`${$queue.length} entries`);
    });
};
