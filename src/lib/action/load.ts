import { addToast } from "$lib/components/toaster.svelte";
import { loadFile } from "$lib/workspace";
import { readFile, timed } from "$lib/utils";

export const load = () => {
    let cumulativeTime = 0;
    readFile(
        ".jar,.zip,.class",
        true,
        async (f) => {
            const { result, time } = await timed("load action", async () => loadFile(f));
            for (const result0 of result) {
                if (!result0.created) {
                    addToast({
                        title: "Duplicate entry",
                        description: `Skipped loading ${result0.entry.data.name}, as it is already present in the workspace.`,
                    });
                }
            }

            cumulativeTime += time;
        },
        async (num) => {
            addToast({
                title: "Loaded",
                description: `Loaded ${num} file(s) in ${cumulativeTime}ms.`,
            });
        }
    );
};
