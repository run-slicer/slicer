import { toast } from "svelte-sonner";
import { loadFile } from "$lib/workspace";
import { partition } from "$lib/utils";
import { readFiles, timed } from "./utils";

export const add = async () => {
    const results = await Promise.all(
        (await readFiles("", true)).map((f) => timed(`add ${f.name}`, () => loadFile(f)))
    );

    const [created, skipped] = partition(
        results.flatMap((r) => r.result),
        (r) => r.created
    );
    if (skipped.length > 0) {
        if (skipped.length <= 5) {
            for (const result of skipped) {
                toast.info("Duplicate entry", {
                    description: `Skipped adding ${result.entry.name}, as it is already present in the workspace.`,
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
        toast.success("Added", {
            description: `Added ${created.length} ${created.length === 1 ? "entry" : "entries"}.`,
        });
    }
};
