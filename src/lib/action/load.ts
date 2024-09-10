import { toast } from "svelte-sonner";
import { loadZip } from "$lib/workspace";
import { partition, readFiles, timed } from "$lib/utils";

export const load = async () => {
    const results = await Promise.all(
        (await readFiles(".jar,.zip", true)).map((f) => timed(`load ${f.name}`, () => loadZip(f)))
    );

    const time = results.reduce((acc, v) => acc + v.time, 0);
    const [created, skipped] = partition(
        results.flatMap((r) => r.result),
        (r) => r.created
    );
    if (skipped.length > 0) {
        if (skipped.length <= 5) {
            for (const result of skipped) {
                toast.info("Duplicate entry", {
                    description: `Skipped adding ${result.entry.shortName}, as it is already present in the workspace.`,
                });
            }
        } else {
            // don't spam toasts for more than 5 entries
            toast.info("Duplicate entries", {
                description: `Skipped adding ${skipped.length} entries, as they were already present in the workspace.`,
            });
        }
    }
    if (created.length > 0) {
        toast.success("Loaded", {
            description: `Loaded ${created.length} ${created.length === 1 ? "entry" : "entries"} in ${time}ms.`,
        });
    }
};
