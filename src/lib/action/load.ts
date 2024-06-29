import { addToast } from "$lib/components/toaster.svelte";
import { loadFile, loadFileOrZip, loadZip } from "$lib/workspace";
import { readFile, timed } from "$lib/utils";

export const loadClass = () => {
    let cumulativeTime = 0;
    readFile(
        ".class",
        true,
        async (f) => {
            const { result, time } = await timed("class load action", () => loadFile(f));
            if (!result.created) {
                addToast({
                    title: "Duplicate entry",
                    description: `Skipped loading ${result.entry.data.name}, as it is already present in the workspace.`,
                });
            }

            cumulativeTime += time;
        },
        async (num) => {
            addToast({
                title: "Loaded",
                description: `Loaded ${num} class(es) in ${cumulativeTime}ms.`,
            });
        }
    );
};

export const loadJar = () => {
    let cumulativeTime = 0;
    readFile(
        ".jar,.zip",
        true,
        async (f) => {
            const { result, time } = await timed("jar load action", async () => loadZip(f));
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
                description: `Loaded ${num} JAR(s) in ${cumulativeTime}ms.`,
            });
        }
    );
};

export const load = () => {
    let cumulativeTime = 0;
    readFile(
        ".jar,.zip,.class",
        true,
        async (f) => {
            const { result, time } = await timed("load action", async () => loadFileOrZip(f));
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
