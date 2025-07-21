import { error } from "$lib/log";
import { analysisJdkClasses } from "$lib/state";
import { record } from "$lib/task";
import { type Entry, EntryType, readDeferred } from "$lib/workspace";
import { index } from "$lib/workspace/jdk";
import { get } from "svelte/store";

export type EntrySource = (name: string) => Promise<Uint8Array | null>;

export const createSource = (classes: Map<string, Entry>, name: string, buf: Uint8Array): EntrySource => {
    return async (name0) => {
        if (name0 === name) {
            return buf;
        }

        let entry = classes.get(name0);
        if (entry) {
            entry = await readDeferred(entry);
            if (entry.type === EntryType.CLASS) {
                return entry.data.bytes();
            }
        }

        const indexedUrl = index.get(name0);
        if (!indexedUrl || !get(analysisJdkClasses)) {
            return null;
        }

        return await record("fetching JDK class", name0, async () => {
            const res = await fetch(indexedUrl);
            if (!res.ok) {
                error(`failed to fetch JDK class '${name0}', status code ${res.status}`);
                return null;
            }

            return res.bytes();
        });
    };
};
