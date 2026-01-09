<script lang="ts" module>
    import {
        crosshairCursor,
        drawSelection,
        dropCursor,
        highlightActiveLine,
        highlightActiveLineGutter,
        highlightSpecialChars,
        hoverTooltip,
        keymap,
        lineNumbers,
        rectangularSelection,
    } from "@codemirror/view";
    import { EditorState, type Extension } from "@codemirror/state";
    import {
        bracketMatching,
        defaultHighlightStyle,
        foldGutter,
        foldKeymap,
        indentOnInput,
        syntaxHighlighting,
    } from "@codemirror/language";
    import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
    import { highlightSelectionMatches, search, searchKeymap } from "@codemirror/search";
    import SearchPanel from "./search.svelte";
    import { mount, unmount } from "svelte";

    export interface TooltipProps {
        view: EditorView;
        pos: number;
        side: -1 | 0 | 1;
    }

    export const extensions: Extension = (() => [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        search({
            createPanel: (view) => {
                const target = document.createElement("div");
                const component = mount(SearchPanel, { target, props: { view } });
                return {
                    dom: target,
                    top: true,
                    destroy() {
                        unmount(component);
                    },
                };
            },
        }),
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
            "background-color": "var(--muted)",
            border: "unset",
            color: "unset",
            margin: "0 0.25rem",
            padding: "0 0.2rem",
        },
        ".cm-scroller": {
            // make scrollbar thinner
            "scrollbar-width": "thin",
            // use Tailwind monospace fonts
            "font-family":
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
        ".cm-panels": {
            // fix color on panel container
            "background-color": "var(--background)",
            // fix overlapping
            "z-index": "auto",
        },
        ".cm-tooltip": {
            // handled by external component
            "background-color": "transparent",
        },
    });
</script>

<script lang="ts">
    import { type Component, onMount } from "svelte";
    import { mode } from "mode-watcher";
    import type { LanguageSupport } from "@codemirror/language";
    import { EditorView } from "@codemirror/view";
    import { Compartment } from "@codemirror/state";
    import { dark, light } from "./theme";

    const readOnlyStore = new Compartment();
    const themeStore = new Compartment();
    const langStore = new Compartment();
    const wrapStore = new Compartment();

    interface Props {
        value?: string;
        readonly?: boolean;
        lang?: LanguageSupport | null;
        size?: number;
        wrap?: boolean;
        view?: EditorView | null;
        onchange?: (view: EditorView) => void;

        tooltip?: Component<TooltipProps>;
    }

    let {
        value = $bindable(""),
        readonly = false,
        lang = null,
        size = $bindable(0.75),
        wrap = false,
        view = $bindable(null),
        onchange,
        tooltip: TooltipComponent,
    }: Props = $props();

    $effect(() => view?.dispatch({ effects: readOnlyStore.reconfigure(EditorState.readOnly.of(readonly)) }));
    $effect(() => view?.dispatch({ effects: themeStore.reconfigure(mode.current === "dark" ? dark : light) }));
    $effect(() => view?.dispatch({ effects: langStore.reconfigure(lang || []) }));
    $effect(() => view?.dispatch({ effects: wrapStore.reconfigure(wrap ? EditorView.lineWrapping : []) }));

    let parent: HTMLDivElement | undefined = $state();
    $effect(() => {
        const oldValue = view?.state?.doc?.toString();
        if (oldValue !== value) {
            view?.dispatch({ changes: { from: 0, to: view?.state?.doc?.length || 0, insert: value } });
        }
    });

    $effect(() => {
        if (view) {
            view.scrollDOM.style.fontSize = `${size}rem`;
            view.contentDOM.style.fontSize = `${size}rem`;
            view.requestMeasure();
        }
    });

    onMount(() => {
        view = new EditorView({
            state: EditorState.create({
                doc: value,
                extensions: [
                    extensions,
                    readOnlyStore.of(EditorState.readOnly.of(readonly)),
                    themeStore.of(mode.current === "dark" ? dark : light),
                    langStore.of(lang || []),
                    wrapStore.of(wrap ? EditorView.lineWrapping : []),
                    styles,
                    EditorView.updateListener.of((e) => {
                        if (e.docChanged) {
                            const newValue = e.state.doc.toString();
                            if (newValue !== value) {
                                value = newValue;
                            }

                            onchange?.(e.view);
                        }
                    }),
                    !TooltipComponent
                        ? []
                        : hoverTooltip((view, pos, side) => ({
                            pos,
                            create() {
                                const target = document.createElement("div");
                                const component = mount(TooltipComponent, {
                                    target,
                                    props: { view, pos, side },
                                });

                                return {
                                    dom: target,
                                    destroy() {
                                        unmount(component);
                                    },
                                };
                            },
                        })),
                ],
            }),
            parent,
        });
        onchange?.(view); // initial value update
    });

    const rescale = (e: WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();

            const toAdd = e.deltaY > 0 ? -0.05 : 0.05;
            size = Math.max(0.25, Math.min(4, size + toAdd));
        }
    };
</script>

<div bind:this={parent} class="absolute h-full w-full" onwheel={rescale}></div>
