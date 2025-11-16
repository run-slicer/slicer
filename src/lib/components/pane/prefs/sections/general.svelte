<script lang="ts">
    import { themes } from "$lib/theme";
    import { mode } from "mode-watcher";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Slider } from "$lib/components/ui/slider";
    import { locale, themeColor, themeRadius } from "$lib/state";
    import { t, locales } from "$lib/i18n";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
    import { capitalize, flagEmoji, languageToCountry, tryOrNull } from "$lib/utils";
    import type { PaneProps } from "$lib/components/pane";

    let _: PaneProps = $props();

    let languageNames = $derived(tryOrNull(() => new Intl.DisplayNames($locale, { type: "language" })));
</script>

<Section id="general" labelKey="pane.prefs.section.general">
    <div class="grid min-h-[2rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label for="locale" textKey="pane.prefs.general.language" />
        <Select type="single" bind:value={$locale}>
            <SelectTrigger id="locale" class="w-48">
                {@const name = tryOrNull(() => languageNames?.of($locale))}
                <span class="inline-flex gap-2">
                    <span>{flagEmoji(languageToCountry($locale))}</span>
                    <span>{name ? capitalize(name) : $locale}</span>
                </span>
            </SelectTrigger>
            <SelectContent>
                {#each locales.keys() as localeCode (localeCode)}
                    <SelectItem value={localeCode} class="gap-2">
                        {@const name = tryOrNull(() => languageNames?.of(localeCode))}
                        <span>{flagEmoji(languageToCountry(localeCode))}</span>
                        <span>{name ? capitalize(name) : localeCode}</span>
                    </SelectItem>
                {/each}
                <SelectItem value="locale.none" class="gap-2">
                    <span>🤖</span>
                    <span>{$t("locale.none")}</span>
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
    <div class="grid min-h-[2rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label for="themeColor" textKey="pane.prefs.general.color" />
        <Select type="single" bind:value={$themeColor}>
            <SelectTrigger id="themeColor" class="w-48">
                {@const theme = themes.find((t) => t.name === $themeColor)}
                {@const cssVars = mode.current === "light" ? theme?.cssVars?.light : theme?.cssVars?.dark}
                <span class="inline-flex items-center gap-2">
                    <span
                        class="size-4 rounded-full"
                        style="background: conic-gradient({cssVars?.primary ?? 'white'}, {cssVars?.secondary ??
                            'black'});"
                    ></span>
                    <span>{theme?.label || $themeColor}</span>
                </span>
            </SelectTrigger>
            <SelectContent>
                {#each themes as theme (theme.name)}
                    {@const cssVars = mode.current === "light" ? theme.cssVars.light : theme.cssVars.dark}
                    <SelectItem value={theme.name} class="items-center gap-2">
                        <div
                            class="size-4 rounded-full"
                            style="background: conic-gradient({cssVars.primary}, {cssVars.secondary});"
                        ></div>
                        {theme.label || theme.name}
                    </SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label for="themeRadius" textKey="pane.prefs.general.radius" descKey="pane.prefs.general.radius.desc" />
        <Slider type="single" id="themeRadius" min={0} max={1} step={0.05} bind:value={$themeRadius} class="w-48" />
    </div>
</Section>
