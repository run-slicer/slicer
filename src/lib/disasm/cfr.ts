import { createSource, type Disassembler } from "./";
import { type ClassEntry, classes } from "$lib/workspace";
import { getClassConst, getUtf8Const } from "$lib/reader";
import { get } from "svelte/store";

const cfr: Disassembler = {
    id: "cfr",
    name: "CFR",
    group: "Decompilers",
    run: async (entry: ClassEntry): Promise<string> => {
        const { node, data } = entry;
        const { decompile } = await import("@run-slicer/cfr");

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

export default cfr;
