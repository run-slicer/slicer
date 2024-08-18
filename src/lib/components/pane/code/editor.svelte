<script lang="ts">
    import { mode } from "mode-watcher";
    import CodeMirror from "svelte-codemirror-editor";
    import type { LanguageSupport } from "@codemirror/language";
    import { dark, light } from "./theme";

    export let value: string;
    export let readonly: boolean = false;
    export let lang: LanguageSupport | null = null;
</script>

<CodeMirror
    bind:value
    {readonly}
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
            // use new font
            "font-family":
                '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            "font-size": "12px",
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
    on:ready
/>
