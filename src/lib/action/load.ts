import { addToast } from "$lib/components/toaster.svelte";
import { loadFile } from "$lib/workspace";
import { partition } from "$lib/arrays";
import { readFiles, timed } from "./utils";

export const load = async () => {
    const results = await Promise.all(
        (await readFiles(".jar,.zip", true)).map((f) => timed(`load ${f.name}`, () => loadFile(f)))
    );

    const time = results.reduce((acc, v) => acc + v.time, 0);
    const [created, skipped] = partition(
        results.flatMap((r) => r.result),
        (r) => r.created
    );
    if (skipped.length > 0) {
        if (skipped.length <= 5) {
            for (const result of skipped) {
                addToast({
                    title: "Duplicate entry",
                    description: `Skipped adding ${result.entry.data.shortName}, as it is already present in the workspace.`,
                });
            }
        } else {
            // don't spam toasts for more than 5 entries
            addToast({
                title: "Duplicate entries",
                description: `Skipped adding ${skipped.length} entries, as they were already present in the workspace.`,
            });
        }
    }
    if (created.length > 0) {
        addToast({
            title: "Loaded",
            description: `Loaded ${created.length} file(s) in ${time}ms.`,
        });
    }
};
