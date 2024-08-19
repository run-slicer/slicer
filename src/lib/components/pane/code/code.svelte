<svelte:options immutable />

<script lang="ts">
    import { EntryType } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, current as currentTab, TabType } from "$lib/tab";
    import { load as loadLanguage } from "$lib/lang";
    import { current as currentDisasm } from "$lib/disasm";
    import { detectLanguage, read } from "./";
    import { get } from "svelte/store";

    export let tab: Tab;
    let entry = tab.entry!;

    let language = detectLanguage(tab.type, entry, $currentDisasm);
    $: {
        const detectedLang = detectLanguage(tab.type, entry, $currentDisasm);

        // suppress updates if we're not active
        if ($currentTab?.id === tab.id && language !== detectedLang /* no change? don't rerender */) {
            language = detectedLang;
        }
    }
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([import("./editor.svelte"), loadLanguage(language), read(tab.type, entry, get(currentDisasm))])}
        <Loading
            value={entry.type === EntryType.CLASS && tab.type === TabType.CODE ? "Disassembling..." : "Reading..."}
            overlay
        />
    {:then [editor, lang, value]}
        <svelte:component this={editor.default} {value} readonly {lang} />
    {/await}
</div>
