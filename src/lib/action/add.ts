import { toast } from "svelte-sonner";
import { fileData, load } from "$lib/workspace";
import { partition } from "$lib/arrays";
import { readFiles, timed } from "./utils";

export const add = async () => {
    const results = await Promise.all(
        (await readFiles("", true)).map((f) => timed(`add ${f.name}`, () => load(fileData(f))))
    );

    const [created, skipped] = partition(results, (r) => r.result.created);
    if (skipped.length > 0) {
        if (skipped.length <= 5) {
            for (const { result } of skipped) {
                toast.info("Duplicate entry", {
                    description: `Skipped adding ${result.entry.data.name}, as it is already present in the workspace.`,
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
            description: `Added ${created.length} file(s).`,
        });
    }
};
