import { type Entry, EntryType, readDeferred } from "$lib/workspace";
import { findClass } from "$lib/workspace/jdk";

export type EntrySource = (name: string) => Promise<Uint8Array | null>;

export const createSource = (
    classes: Map<string, Entry>,
    name: string,
    buf: Uint8Array,
    useJdkClasses: boolean
): EntrySource => {
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

        return useJdkClasses ? findClass(name0) : null;
    };
};
