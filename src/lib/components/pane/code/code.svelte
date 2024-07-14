<script lang="ts">
    import { mode } from "mode-watcher";
    import { Binary, Code } from "lucide-svelte";
    import type { Entry } from "$lib/workspace";
    import { editorView } from "$lib/state";
    import { close } from "$lib/action";
    import Loading from "$lib/components/loading.svelte";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane";
    import { load, fromEntry } from "./lang";
    import { detectView, read } from "./";

    export let entry: Entry | null = null;

    $: view = $editorView === "auto" ? detectView(entry) : $editorView;

    $: text = view === "text";
    $: hex = view === "hex";

    $: language = entry && text ? fromEntry(entry) : hex ? "hex" : "plaintext";
</script>

<div class="flex h-full w-full flex-col scrollbar-thin">
    <PaneHeader>
        <PaneHeaderItem
            name={entry ? entry.data.shortName : "Code"}
            icon={hex ? Binary : Code}
            closeable={entry !== null}
            on:close={close}
        />
    </PaneHeader>
    <div class="relative basis-full overflow-hidden">
        {#if entry}
            {#await Promise.all( [import("svelte-codemirror-editor"), import("./theme"), load(language), read(view, entry)] )}
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
        {/if}
    </div>
</div>
