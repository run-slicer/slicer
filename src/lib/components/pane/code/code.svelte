<script lang="ts">
    import { mode } from "mode-watcher";
    import { Code } from "lucide-svelte";
    import type { Entry } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { PaneHeader } from "$lib/components/pane";
    import { load, fromEntry } from "./lang";
    import { dark, light } from "./theme";
    import { read } from "./data";

    export let entry: Entry | null = null;
    $: language = entry ? fromEntry(entry) : "plaintext";
</script>

<div class="flex h-full w-full flex-col scrollbar-thin">
    <PaneHeader name="Code" icon={Code} />
    <div class="relative basis-full overflow-hidden">
        {#await Promise.all([import("svelte-codemirror-editor"), load(language), read(entry)])}
            <Loading value={entry?.type === "class" ? "Decompiling..." : "Reading..."} overlay />
        {:then [editor, lang, value]}
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
                }}
            />
        {/await}
    </div>
</div>
