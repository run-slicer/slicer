<script lang="ts">
    import { mode } from "mode-watcher";
    import { Binary, Code } from "lucide-svelte";
    import { current as currentWs, type Entry } from "$lib/workspace";
    import { editorView } from "$lib/state";
    import Loading from "$lib/components/loading.svelte";
    import { remove as removeTab, update as updateTab } from "$lib/tab";
    import { close } from "$lib/action/close";
    import { load, fromEntry } from "./lang";
    import { detectView, read } from "./";
    import { get } from "svelte/store";

    export let entry: Entry;

    $: view = $editorView === "auto" ? detectView(entry) : $editorView;

    $: text = view === "text";
    $: hex = view === "hex";

    $: language = text ? fromEntry(entry) : hex ? "hex" : "plaintext";

    $: updateTab({
        id: entry.data.name,
        name: entry.data.shortName,
        icon: hex ? Binary : Code,
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
    {#await Promise.all([import("svelte-codemirror-editor"), import("./theme"), load(language), read(view, entry)])}
        <Loading value={entry.type === "class" && text ? "Decompiling..." : "Reading..."} overlay />
    {:then [editor, { dark, light }, lang, value]}
        <svelte:component
            this={editor.default}
            {value}
            readonly
            theme={$mode === "dark" ? dark : light}
            {lang}
            class="absolute h-full w-full"
            styles={{
                "&": {
                    // make editor 100% height of parent
                    height: "100%",
                },
                ".cm-line": {
                    // add some scrolling room to line ends
                    "padding-right": "2.5rem",
                },
                ".cm-foldPlaceholder": {
                    // fix color on collapse placeholder
                    "background-color": "hsl(var(--muted))",
                    border: "unset",
                    color: "unset",
                    margin: "0 0.25rem",
                    padding: "0 0.2rem",
                },
                ".cm-scroller": {
                    // make scrollbar thinner
                    "scrollbar-width": "thin",
                },
                ".cm-panels": {
                    // fix color on panel container
                    "background-color": "hsl(var(--background))",
                },
                ".cm-search": {
                    // fix alignment on search panel
                    display: "flex",
                    "align-items": "center",
                },
                ".cm-button": {
                    // fix color on search button
                    "background-color": "hsl(var(--secondary))",
                    "border-color": "hsl(var(--secondary))",
                    "border-radius": "0.25rem", // rounded
                    "background-image": "unset",
                },
            }}
        />
    {/await}
</div>
