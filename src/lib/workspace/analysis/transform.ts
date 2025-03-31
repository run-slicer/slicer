import type { Icon } from "$lib/components/icons";
import { log } from "$lib/log";
import { rootContext } from "$lib/script";
import { analysisTransformers } from "$lib/state";
import { recordProgress } from "$lib/task";
import type { ClassEntry } from "$lib/workspace";
import { transformData } from "$lib/workspace/data";
import { Paintbrush, ShieldCheck } from "@lucide/svelte";
import { write } from "@run-slicer/asm";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import { AttributeType } from "@run-slicer/asm/spec";
import { get, writable, type Writable } from "svelte/store";
import { AnalysisState, analyze } from "./";

export interface Transformer {
    id: string;
    name?: string;
    icon?: Icon;

    // hides it from the menu and makes it always enabled
    internal?: boolean;

    run(entry: ClassEntry, data: Uint8Array): Uint8Array | PromiseLike<Uint8Array>;
}

export const transformers: Writable<Transformer[]> = writable([
    {
        id: "script",
        name: "Scripts",
        internal: true,
        async run(entry, data) {
            return (await rootContext.dispatchEvent({ type: "preload", name: entry.name, data })).data;
        },
    },
    {
        id: "verify",
        name: "Verify attributes",
        icon: ShieldCheck,
        async run(entry, _data) {
            const { verify } = await import("@run-slicer/asm/analysis/verify");
            entry.node = verify(entry.node);

            return write(entry.node);
        },
    },
    {
        id: "unreachable",
        name: "No-op unreachable code",
        icon: Paintbrush,
        async run(entry, _data) {
            const { removeUnreachable } = await import("@run-slicer/asm/analysis/reach");
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    method.attrs[code] = removeUnreachable(method.attrs[code] as CodeAttribute);
                }
            }

            return write(entry.node);
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
