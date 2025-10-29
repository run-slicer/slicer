import { locale } from "$lib/state";
import { derived, get, type Readable } from "svelte/store";
import type { LocaleData } from "../../locale";

export const locales = new Map(
    Object.entries(import.meta.glob("../../locale/*.json", { import: "default" })).map(([path, resolver]) => {
        return [path.split("/").pop()!.split(".")[0], resolver as () => Promise<LocaleData>];
    })
);

const localeData = derived<typeof locale, LocaleData | null>(locale, ($locale, set) => {
    const resolve = locales.get($locale);
    if (resolve) {
        resolve().then(set);
    } else {
        set(null); // invalid locale
    }
});

export type TranslationKey = keyof LocaleData;

type TranslationFunc = (key: TranslationKey, ...args: any[]) => string;
export const t = derived(localeData, ($localeData): TranslationFunc => {
    return (key, ...args) => {
        return $localeData ? ($localeData[key]?.replace(/{(\d+)}/g, (m, i) => args[i]?.toString() ?? m) ?? key) : key;
    };
});

export const tl: TranslationFunc = (key, ...args) => get(t)(key, ...args);

export const tls = (group: string): Readable<string[]> => {
    return derived(localeData, ($localeData) => {
        return Object.entries($localeData ?? {})
            .filter(([key]) => key.startsWith(group))
            .map(([, value]) => value);
    });
};
