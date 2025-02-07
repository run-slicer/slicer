import { error } from "$lib/log";
import { analysisBackground } from "$lib/state";
import { recordProgress } from "$lib/task";
import { FLAG_SKIP_ATTR } from "@run-slicer/asm";
import { wrap } from "comlink";
import { get } from "svelte/store";
import { type ClassEntry, type Entry, EntryType } from "../";
import type { Worker as AnalysisWorker } from "./worker";
import Worker from "./worker?worker";

export const enum AnalysisState {
    NONE,
    PARTIAL,
    FULL,
}

const worker = wrap<AnalysisWorker>(new Worker());
const analyzeClass = async (entry: Entry, skipAttr: boolean) => {
    const buffer = await entry.data.bytes();

    try {
        const classEntry = entry as ClassEntry;

        classEntry.node = await worker.read(buffer, skipAttr ? FLAG_SKIP_ATTR : 0);
        classEntry.type = EntryType.CLASS;
    } catch (e) {
        error(`failed to read class ${entry.name}`, e);
    }
};

export const analyze = async (entry: Entry, state: AnalysisState = AnalysisState.PARTIAL) => {
    if (entry.state === AnalysisState.FULL) return;

    // full analysis does more expensive magic header detection
    // and reads class nodes in their entirety
    switch (state) {
        case AnalysisState.PARTIAL: {
            switch (entry.extension) {
                case "class":
                    await analyzeClass(entry, true);
                    break;
            }
            break;
        }
        case AnalysisState.FULL: {
            const blob = await entry.data.blob();
            const magic = blob.size >= 4 ? new DataView(await blob.slice(0, 4).arrayBuffer()).getUint32(0, false) : 0;

            switch (magic) {
                case 0xcafebabe:
                    await analyzeClass(entry, false);
                    break;
            }
            break;
        }
    }

    entry.state = state;
};

let queue: Entry[] = [];

export const schedule = (entry: Entry) => queue.push(entry);

export const analyzeBackground = async () => {
    // snapshot queue
    const $queue = queue.filter((e) => e.state === AnalysisState.NONE);
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
