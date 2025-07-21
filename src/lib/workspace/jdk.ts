import { error } from "$lib/log";
import { record } from "$lib/task";
import { toast } from "svelte-sonner";

// JDK indexes are produced by the ojdk utility (https://github.com/run-slicer/ojdk)

type DataIndex = Map<string, string>; // [class name -> url]
const fetchIndex = async (url: string): Promise<DataIndex> => {
    const index = new Map<string, string>();

    try {
        const data: Record<string, string[]> = await (await fetch(`${url}/index.json`)).json();
        for (const [module, classes] of Object.entries(data)) {
            for (const klass of classes) {
                index.set(klass, `${url}/${module}/${klass}.class`);
            }
        }
    } catch (e) {
        error("failed to fetch class index", e);
        toast.error("Error occurred", {
            description: "Failed to fetch the JDK class index, check the console.",
        });
    }

    return index;
};

export const index = await record("fetching JDK class index", null, () => fetchIndex("https://data.slicer.run/21"));
