import { tl } from "$lib/i18n";
import { error } from "$lib/log";
import { record } from "$lib/task";
import { refFromName } from "$lib/utils";
import type { ExternalTypeReference } from "@katana-project/laser";
import { toast } from "svelte-sonner";

// JDK indexes are produced by the ojdk utility (https://github.com/katana-project/ojdk)

interface RawDataIndex {
    url: string;
    data: Record<string, string[]>;
}

const fetchIndex = async (url: string): Promise<RawDataIndex> => {
    let data: Record<string, string[]> = {};
    try {
        data = await (await fetch(`${url}/index.json`)).json();
    } catch (e) {
        error("failed to fetch class index", e);
        toast.error(tl("toast.error.title.generic"), {
            description: tl("toast.error.class-index"),
        });
    }

    return { url, data };
};

// use the OpenJDK 25 index globally
const rawIndex = await fetchIndex("https://data.slicer.run/25");

type DataIndex = Map<string, string>; // [class name -> url]

const createIndex = ({ url, data }: RawDataIndex): DataIndex => {
    const index = new Map<string, string>();
    for (const [module, classes] of Object.entries(data)) {
        for (const klass of classes) {
            index.set(klass, `${url}/${module}/${klass}.class`);
        }
    }

    return index;
};

export const index = createIndex(rawIndex);

// shouldn't be too big, the entire class library is around a hundred MB
const cache = new Map<string, Uint8Array>();
export const findClass = async (name: string): Promise<Uint8Array | null> => {
    const url = index.get(name);
    if (!url) {
        return null;
    }

    const cacheData = cache.get(name);
    if (cacheData) {
        return cacheData;
    }

    return await record("task.fetch", name, async () => {
        const res = await fetch(url);
        if (!res.ok) {
            error(`failed to fetch class '${name}', status code ${res.status}`);
            return null;
        }

        const data = await res.bytes();
        cache.set(name, data);
        return data;
    });
};

export const jdkRefs: ExternalTypeReference[] = Object.values(rawIndex.data)
    .flatMap((classes) => classes)
    .map(refFromName);
