import { error } from "$lib/log";
import { analysisBackground } from "$lib/state";
import { recordProgress } from "$lib/task";
import { rateLimit, roundRobin } from "$lib/utils";
import { type ClassEntry, entries, type Entry, EntryType, type MemberEntry } from "$lib/workspace";
import { FLAG_SKIP_ATTR, FLAG_SLICE_BUFFER } from "@katana-project/asm";
import { wrap } from "comlink";
import { get } from "svelte/store";
import { QueryType, SearchMode, type SearchQuery, type SearchResult } from "./search";
import type { Worker as AnalysisWorker } from "./worker";
import Worker from "./worker?worker";

export const enum AnalysisState {
    NONE,
    PARTIAL,
    FULL,
}

const MAX_CONCURRENT = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));

const worker = roundRobin(MAX_CONCURRENT, () => wrap<AnalysisWorker>(new Worker()));
const analyzeClass = async (entry: Entry, skipAttr: boolean) => {
    const buffer = await entry.data.bytes();

    try {
        const classEntry = entry as ClassEntry;

        classEntry.node = await worker().read(buffer, skipAttr ? FLAG_SKIP_ATTR | FLAG_SLICE_BUFFER : 0);
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
            const magic = new DataView(await blob.slice(0, Math.min(8, blob.size)).arrayBuffer());
            if (magic.byteLength >= 8) {
                if (entry.extension?.includes("xml") && magic.getUint16(0, true) === 0x0003 /* ChunkType.ResXml */) {
                    entry.type = EntryType.BINARY_XML;
                    break;
                }
            }
            if (magic.byteLength >= 4) {
                if (magic.getUint32(0, false) === 0xcafebabe) {
                    await analyzeClass(entry, false);
                    break;
                }
            }
            break;
        }
    }

    entry.state = state;
};

let queue: Entry[] = [];

export const analyzeSchedule = (...entries: Entry[]) => queue.push(...entries);

export const analyzeBackground = async () => {
    // snapshot queue
    const $queue = queue.filter((e) => e.state === AnalysisState.NONE);
    queue = [];

    if (!get(analysisBackground) || $queue.length === 0) return;

    await recordProgress("task.analyze", null, async (task) => {
        let completed = 0;
        await Promise.all(
            $queue.map(
                rateLimit(async (entry) => {
                    await analyze(entry);

                    completed++;
                    task.desc.set(`${completed}/${$queue.length}`);
                    task.progress?.set((completed / $queue.length) * 100);
                }, MAX_CONCURRENT)
            )
        );

        task.desc.set(`${$queue.length}`);
    });

    // very hacky, but we need to trigger post-analysis updates to entries -> classes -> consumers
    entries.update(($entries) => $entries);
};

export { QueryType, SearchMode, type SearchQuery, type SearchResult };

export const search = async (entries: Entry[], query: SearchQuery, onResult: (result: SearchResult) => void) => {
    entries = entries.filter((e) => e.type === EntryType.CLASS);

    await recordProgress("task.search", null, async (task) => {
        let completed = 0;
        await Promise.all(
            (entries as ClassEntry[]).map(
                rateLimit(async (entry) => {
                    (await worker().search({ ...query, node: entry.node })).forEach((res) =>
                        onResult({ ...res, entry })
                    );

                    completed++;
                    task.desc.set(`${completed}/${entries.length}`);
                    task.progress?.set((completed / entries.length) * 100);
                }, MAX_CONCURRENT)
            )
        );

        task.desc.set(`${entries.length}`);
    });
};
