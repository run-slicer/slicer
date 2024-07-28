import { type Entry, readDetail } from "$lib/workspace";

export type EntrySource = (name: string) => Promise<Uint8Array | null>;

export const createSource = (classes: Map<string, Entry>, name: string, buf: Uint8Array): EntrySource => {
    return async (name0) => {
        if (name0 === name) {
            return buf;
        }

        let entry = classes.get(name0);
        if (!entry) {
            return null;
        }

        entry = await readDetail(entry);
        if (entry.type !== "class") {
            return null; // not a class
        }

        return entry.data.arrayBuffer().then((ab) => new Uint8Array(ab));
    };
};
