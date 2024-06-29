import { get, writable } from "svelte/store";
import { type Entry, type ClassEntry, classes, current as currentWs, narrow } from "$lib/workspace";
import { getClassConst, getUtf8Const } from "$lib/reader";

export interface Decompiler {
    id: string;
    name?: string;
    decompile: (entry: ClassEntry) => Promise<string>;
}

type EntrySource = (name: string) => Promise<Uint8Array | null>;

const createSource = (classes: Map<string, Entry>, name: string, buf: Uint8Array): EntrySource => {
    return async (name0) => {
        if (name0 === name) {
            return buf;
        }

        let entry = classes.get(name0);
        if (!entry) {
            return null;
        }

        entry = await narrow(entry);
        if (entry.type !== "class") {
            return null; // not a class
        }

        return entry.data.arrayBuffer().then((ab) => new Uint8Array(ab));
    };
};

const cfr: Decompiler = {
    id: "cfr",
    name: "CFR",
    decompile: async (entry: ClassEntry): Promise<string> => {
        const { node, data } = entry;
        const { decompile } = await import("./cfr/dist/cfr.js");

        const buf = new Uint8Array(await data.arrayBuffer());
        const name = getUtf8Const(node.pool, getClassConst(node.pool, node.this_)!)!;

        const output = await decompile(name, { source: createSource(get(classes), name, buf) });

        // output postprocessing - remove header comment
        const start = output.indexOf("/*\n");
        const end = output.indexOf(" */\n");

        if (start >= 0 && end > start) {
            return output.substring(0, start) + output.substring(end + 4);
        }
        return output;
    },
};

const vf: Decompiler = {
    id: "vf",
    name: "Vineflower",
    decompile: async (entry: ClassEntry): Promise<string> => {
        const { node, data } = entry;
        const { decompile } = await import("./vf/dist/vf.js");

        const buf = new Uint8Array(await data.arrayBuffer());
        const name = getUtf8Const(node.pool, getClassConst(node.pool, node.this_)!)!;

        const classes0 = get(classes);
        return await decompile(name, {
            source: createSource(classes0, name, buf),
            resources: Array.from(classes0.keys()),
        });
    },
};

export const all: Map<string, Decompiler> = new Map([
    [cfr.id, cfr],
    [vf.id, vf],
]);

export const current = writable<Decompiler>(cfr);

current.subscribe(() => {
    const entry = get(currentWs);
    if (entry && entry.type === "class") {
        currentWs.set(entry); // force update
    }
});

export const swap = (id: string) => {
    const next = all.get(id);
    if (!next || next.id === get(current).id) {
        return;
    }

    current.set(next);
};
