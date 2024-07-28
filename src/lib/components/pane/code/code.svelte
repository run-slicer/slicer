<script lang="ts">
    import { Binary } from "lucide-svelte";
    import { current as currentWs, type Entry } from "$lib/workspace";
    import { editorView } from "$lib/state";
    import { fileIcon } from "$lib/components/icons";
    import Loading from "$lib/components/loading.svelte";
    import { remove as removeTab, update as updateTab } from "$lib/tab";
    import { close } from "$lib/action/close";
    import { load, fromEntry } from "./lang";
    import { detect, read } from "./";
    import { get } from "svelte/store";

    export let entry: Entry;

    $: view = $editorView === "auto" ? detect(entry) : $editorView;

    $: text = view === "text";
    $: hex = view === "hex";

    $: language = text ? fromEntry(entry) : hex ? "hex" : "plaintext";

    $: updateTab({
        id: entry.data.name,
        name: entry.data.shortName,
        icon: hex ? { icon: Binary, classes: ["text-muted-foreground"] } : fileIcon(entry.data.shortName),
        entry: entry,
        active: (tab) => get(currentWs)?.data?.name === tab.id,
        open: (tab) => {
            if (get(currentWs)?.data?.name !== tab.id) {
                currentWs.set(tab.entry || null);
            }
        },
        close: (tab) => {
            removeTab(tab.id);
            if (get(currentWs)?.data?.name === tab.id) {
                close(); // currently opened, close with action
            }
        },
    });
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([import("./editor.svelte"), load(language), read(view, entry)])}
        <Loading value={entry.type === "class" && text ? "Decompiling..." : "Reading..."} overlay />
    {:then [editor, lang, value]}
        <svelte:component this={editor.default} {value} readonly {lang} />
    {/await}
</div>
