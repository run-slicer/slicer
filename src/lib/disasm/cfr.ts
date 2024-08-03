import type { Disassembler } from "./";
import { createSource } from "./source";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { type ClassEntry, classes } from "$lib/workspace";
import { get } from "svelte/store";

const cfr: Disassembler = {
    id: "cfr",
    name: "CFR",
    group: "Decompilers",
    lang: "java",
    run: async (entry: ClassEntry): Promise<string> => {
        const { node, data } = entry;
        const { decompile } = await import("@run-slicer/cfr");

        const buf = new Uint8Array(await data.arrayBuffer());
        const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();

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
