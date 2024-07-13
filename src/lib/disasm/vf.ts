import { createSource, type Disassembler } from "./";
import { type ClassEntry, classes } from "$lib/workspace";
import { getClassConst, getUtf8Const } from "$lib/reader";
import { get } from "svelte/store";

const vf: Disassembler = {
    id: "vf",
    name: "Vineflower",
    group: "Decompilers",
    run: async (entry: ClassEntry): Promise<string> => {
        const { node, data } = entry;
        const { decompile } = await import("@run-slicer/vf");

        const buf = new Uint8Array(await data.arrayBuffer());
        const name = getUtf8Const(node.pool, getClassConst(node.pool, node.this_)!)!;

        const classes0 = get(classes);
        return await decompile(name, {
            source: createSource(classes0, name, buf),
            resources: Array.from(classes0.keys()),
        });
    },
};

export default vf;
