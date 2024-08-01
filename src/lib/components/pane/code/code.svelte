<script lang="ts">
    import { Binary } from "lucide-svelte";
    import { type Entry, EntryType } from "$lib/workspace";
    import { editorView, View } from "$lib/state";
    import { fileIcon } from "$lib/components/icons";
    import Loading from "$lib/components/loading.svelte";
    import { TabType, update as updateTab } from "$lib/tab";
    import { fromEntry, load } from "./lang";
    import { detect, read } from "./";

    export let entry: Entry;

    $: view = $editorView === View.AUTO ? detect(entry) : $editorView;

    $: text = view === View.TEXT;
    $: hex = view === View.HEX;

    $: language = text ? fromEntry(entry) : hex ? "hex" : "plaintext";

    $: updateTab({
        id: `${TabType.CODE}:${entry.data.name}`,
        type: TabType.CODE,
        name: entry.data.shortName,
        icon: hex ? { icon: Binary, classes: ["text-muted-foreground"] } : fileIcon(entry.data.shortName),
        entry: entry,
    });
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([import("./editor.svelte"), load(language), read(view, entry)])}
        <Loading value={entry.type === EntryType.CLASS && text ? "Decompiling..." : "Reading..."} overlay />
    {:then [editor, lang, value]}
        <svelte:component this={editor.default} {value} readonly {lang} />
    {/await}
</div>
