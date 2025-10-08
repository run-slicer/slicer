import { classes, EntryType, readDeferred } from "$lib/workspace";
import { findClass, index } from "$lib/workspace/jdk";
import { get } from "svelte/store";

export type EntrySource = (name: string) => Promise<Uint8Array | null>;

export const createSource = (name: string, buf: Uint8Array, useJdkClasses: boolean): EntrySource => {
    const $classes = get(classes);

    return async (name0) => {
        if (name0 === name) {
            return buf;
        }

        let entry = $classes.get(name0);
        if (entry) {
            entry = await readDeferred(entry);
            if (entry.type === EntryType.CLASS) {
                return entry.data.bytes();
            }
        }

        return useJdkClasses ? findClass(name0) : null;
    };
};

export const createResources = (useJdkClasses: boolean): string[] => {
    return useJdkClasses
        ? [...Array.from(get(classes).keys()), ...Array.from(index.keys())]
        : Array.from(get(classes).keys());
};
