<script lang="ts" context="module">
    import {
        keymap,
        highlightSpecialChars,
        drawSelection,
        highlightActiveLine,
        dropCursor,
        rectangularSelection,
        crosshairCursor,
        lineNumbers,
        highlightActiveLineGutter,
    } from "@codemirror/view";
    import { type Extension, EditorState } from "@codemirror/state";
    import {
        defaultHighlightStyle,
        syntaxHighlighting,
        indentOnInput,
        bracketMatching,
        foldGutter,
        foldKeymap,
    } from "@codemirror/language";
    import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
    import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

    export const basicSetup: Extension = (() => [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap]),
    ])();

    export const styles: Extension = EditorView.theme({
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
    });
</script>

<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { mode } from "mode-watcher";
    import type { LanguageSupport } from "@codemirror/language";
    import { EditorView } from "@codemirror/view";
    import { dark, light } from "./theme";
    import { Compartment } from "@codemirror/state";

    export let value: string = "";
    export let readOnly: boolean = false;
    export let lang: LanguageSupport | null = null;
    export let textSize: number = 12;
    export let wrap: boolean = false;

    const readOnlyStore = new Compartment();
    const themeStore = new Compartment();
    const langStore = new Compartment();
    const wrapStore = new Compartment();

    export let view: EditorView | null = null;
    $: view?.dispatch({ effects: readOnlyStore.reconfigure(EditorState.readOnly.of(readOnly)) });
    $: view?.dispatch({ effects: themeStore.reconfigure($mode === "dark" ? dark : light) });
    $: view?.dispatch({ effects: langStore.reconfigure(lang || []) });
    $: view?.dispatch({ effects: wrapStore.reconfigure(wrap ? EditorView.lineWrapping : []) });

    let parent: HTMLDivElement;

    $: {
        const oldValue = view?.state?.doc?.toString();
        if (oldValue !== value) {
            view?.dispatch({ changes: { from: 0, to: view?.state?.doc?.length || 0, insert: value } });
        }
    }

    $: {
        if (view) {
            view.scrollDOM.style.fontSize = `${textSize}rem`;
            view.contentDOM.style.fontSize = `${textSize}rem`;
            view.requestMeasure();
        }
    }

    const dispatch = createEventDispatcher();

    onMount(() => {
        view = new EditorView({
            state: EditorState.create({
                doc: value,
                extensions: [
                    basicSetup,
                    readOnlyStore.of(EditorState.readOnly.of(readOnly)),
                    themeStore.of($mode === "dark" ? dark : light),
                    langStore.of(lang || []),
                    wrapStore.of(wrap ? EditorView.lineWrapping : []),
                    styles,
                    EditorView.updateListener.of((e) => {
                        if (e.docChanged) {
                            const newValue = e.state.doc.toString();
                            if (newValue !== value) {
                                value = newValue;
                            }

                            dispatch("change", { view: e.view, state: e.state });
                        }
                    }),
                ],
            }),
            parent,
        });

        parent.addEventListener("wheel", (e) => {
            if (e.ctrlKey) {
                e.preventDefault();

                const toAdd = e.deltaY > 0 ? -0.05 : 0.05;
                textSize = Math.max(0.25, Math.min(4, textSize + toAdd));
            }
        });
    });
</script>

<div bind:this={parent} class="absolute h-full w-full" />
