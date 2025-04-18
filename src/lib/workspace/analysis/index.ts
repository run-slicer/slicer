import { error } from "$lib/log";
import { analysisBackground } from "$lib/state";
import { recordProgress } from "$lib/task";
import { rateLimit, roundRobin } from "$lib/utils";
import { FLAG_SKIP_ATTR } from "@run-slicer/asm";
import { wrap } from "comlink";
import { get } from "svelte/store";
import { type ClassEntry, type Entry, EntryType, type MemberEntry } from "../";
import { QueryType, SearchMode, type SearchQuery, type SearchResult } from "./search";
import type { Worker as AnalysisWorker } from "./worker";
import Worker from "./worker?worker";

export const enum AnalysisState {
    NONE,
    PARTIAL,
    FULL,
}

const MAX_CONCURRENT = 5;

const worker = roundRobin(MAX_CONCURRENT, () => wrap<AnalysisWorker>(new Worker()));
const analyzeClass = async (entry: Entry, skipAttr: boolean) => {
    const buffer = await entry.data.bytes();

    try {
        const classEntry = entry as ClassEntry;

        classEntry.node = await worker().read(buffer, skipAttr ? FLAG_SKIP_ATTR : 0);
        if (entry.type === EntryType.MEMBER) {
            const memberEntry = entry as MemberEntry;

            // replace the member with a newly analyzed one
            const member = memberEntry.member;
            memberEntry.member =
                (member.type.string.charAt(0) === "(" ? memberEntry.node.methods : memberEntry.node.fields).find(
                    (m) => m.name.string === member.name.string && m.type.string === member.type.string
                ) || member;
        } else {
            classEntry.type = EntryType.CLASS;
        }
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

export const analyzeSchedule = (entry: Entry) => queue.push(entry);

export const analyzeBackground = async () => {
    // snapshot queue
    const $queue = queue.filter((e) => e.state === AnalysisState.NONE);
    queue = [];

    if (!get(analysisBackground) || $queue.length === 0) return;

    await recordProgress("analyzing", null, async (task) => {
        let completed = 0;
        await Promise.all(
            $queue.map(
                rateLimit(async (entry) => {
                    await analyze(entry);

                    completed++;
                    task.desc.set(`${$queue.length} entries (${$queue.length - completed} remaining)`);
                    task.progress?.set((completed / $queue.length) * 100);
                }, MAX_CONCURRENT)
            )
        );

        task.desc.set(`${$queue.length} entries`);
    });
};

export { QueryType, SearchMode, type SearchQuery, type SearchResult };

export const search = async (entries: Entry[], query: SearchQuery, onResult: (result: SearchResult) => void) => {
    entries = entries.filter((e) => e.type === EntryType.CLASS);

    await recordProgress("searching", null, async (task) => {
        let completed = 0;
        await Promise.all(
            (entries as ClassEntry[]).map(
                rateLimit(async (entry) => {
                    (await worker().search({ ...query, node: entry.node })).forEach((res) =>
                        onResult({ ...res, entry })
                    );

                    completed++;
                    task.desc.set(`${entries.length} entries (${entries.length - completed} remaining)`);
                    task.progress?.set((completed / entries.length) * 100);
                }, MAX_CONCURRENT)
            )
        );

        task.desc.set(`${entries.length} entries`);
    });
};
