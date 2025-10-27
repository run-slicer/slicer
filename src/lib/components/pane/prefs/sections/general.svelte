<script lang="ts">
    import { themes } from "$lib/theme";
    import { mode } from "mode-watcher";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Slider } from "$lib/components/ui/slider";
    import { locale, themeColor, themeRadius } from "$lib/state";
    import { locales } from "$lib/i18n";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
    import { flagEmoji, languageToCountry } from "$lib/utils";

    let languageNames = $derived(new Intl.DisplayNames($locale, { type: "language" }));
</script>

<Section id="general" label="General">
    <div class="grid min-h-[2rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="locale" text="Language" />
        <Select type="single" bind:value={$locale}>
            <SelectTrigger id="locale" class="w-48">
                {languageNames.of($locale)}
            </SelectTrigger>
            <SelectContent>
                {#each locales.keys() as localeCode (localeCode)}
                    <SelectItem value={localeCode} class="gap-2">
                        <span>{flagEmoji(languageToCountry(localeCode))}</span>
                        <span>{languageNames.of(localeCode)}</span>
                    </SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>
    <div class="grid min-h-[2rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="themeColor" text="Color" />
        <Select type="single" bind:value={$themeColor}>
            <SelectTrigger id="themeColor" class="w-48">
                {themes.find((t) => t.name === $themeColor)?.label || $themeColor}
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
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="themeRadius" text="Radius">Alters the smoothness of UI corners.</Label>
        <Slider type="single" id="themeRadius" min={0} max={1} step={0.05} bind:value={$themeRadius} class="w-48" />
    </div>
</Section>
