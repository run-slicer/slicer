import type { Icon } from "$lib/components/icons";
import { log } from "$lib/log";
import { rootContext } from "$lib/script";
import { analysisTransformers } from "$lib/state";
import { recordProgress } from "$lib/task";
import type { ClassEntry } from "$lib/workspace";
import { AnalysisState, analyze } from "$lib/workspace/analysis";
import { transformData } from "$lib/workspace/data";
import { get, writable, type Writable } from "svelte/store";
import normalizationTransformers from "./normalization";
import readabilityTransformers from "./readability";

export interface Transformer {
    id: string;
    name?: string;
    group?: string;
    icon?: Icon;

    // hides it from the menu and makes it always enabled
    internal?: boolean;

    run(entry: ClassEntry, data: Uint8Array): Uint8Array | PromiseLike<Uint8Array>;
}

export const transformers: Writable<Transformer[]> = writable([
    ...readabilityTransformers,
    ...normalizationTransformers,
    // script transforms should be processed last
    {
        id: "script",
        name: "Scripts",
        internal: true,
        async run(entry, data) {
            return (await rootContext.dispatchEvent({ type: "preload", name: entry.name, data })).data;
        },
    },
]);

export const enabled = (trf: Transformer): boolean => trf.internal || get(analysisTransformers).includes(trf.id);
export const toggle = (trf: Transformer, enabled: boolean) => {
    analysisTransformers.update(($analysisTransformers) => {
        // remove existing entry
        $analysisTransformers = $analysisTransformers.filter((i) => i !== trf.id);
        if (enabled) {
            $analysisTransformers.push(trf.id);
        }

        return $analysisTransformers;
    });
};

export const transform = async (entry: ClassEntry, data: Uint8Array): Promise<ClassEntry> => {
    const enabledTrfs = Array.from(get(transformers).values()).filter(enabled);

    const originalData = data;
    await recordProgress("transforming", entry.name, async (task) => {
        for (let i = 0; i < enabledTrfs.length; i++) {
            const transformer = enabledTrfs[i];

            log(`running transformer '${transformer.id}' on '${entry.name}'`);
            data = await transformer.run(entry, data);
            task.progress?.set((i + 1) / enabledTrfs.length);
        }
    });

    // create transformed entry only if a transformation happened
    if (data !== originalData) {
        entry = { ...entry, data: transformData(entry.data, data), state: AnalysisState.NONE };

        await analyze(entry, AnalysisState.FULL);
    }

    return entry;
};
