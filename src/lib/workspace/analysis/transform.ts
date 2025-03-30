import { rootContext } from "$lib/script";
import type { ClassEntry } from "$lib/workspace";
import { transformData } from "$lib/workspace/data";
import { AnalysisState, analyze } from "./";

export interface Transformer {
    name: string;

    run(entry: ClassEntry, data: Uint8Array): Uint8Array | PromiseLike<Uint8Array>;
}

const scriptTrf: Transformer = {
    name: "script",
    async run(entry, data) {
        return (await rootContext.dispatchEvent({ type: "preload", name: entry.name, data })).data;
    },
};

export const transformers: Map<string, Transformer> = new Map([[scriptTrf.name, scriptTrf]]);

export const transform = async (entry: ClassEntry, data: Uint8Array): Promise<ClassEntry> => {
    const originalData = data;
    for (const transformer of transformers.values()) {
        data = await transformer.run(entry, data);
    }

    // create transformed entry only if a transformation happened
    if (data !== originalData) {
        entry = { ...entry, data: transformData(entry.data, data), state: AnalysisState.NONE };

        await analyze(entry, AnalysisState.FULL);
    }

    return entry;
};
