<script lang="ts">
    import { classRefs, EntryType } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { load as loadLanguage } from "$lib/lang";
    import { canInterpret, detectInterpretation, detectLanguage, Interpretation, read } from "./";
    import CodeEditor from "$lib/components/editor/editor.svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { SquareCode } from "@lucide/svelte";
    import { jasm, vf } from "$lib/disasm/builtin";
    import {
        editorTextSize,
        editorTextSizeSync,
        editorWrap,
        interpHexRowBytes,
        toolsDisasm,
        toolsDisasmOptions,
    } from "$lib/state";
    import { get, writable } from "svelte/store";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import CodeMenu from "./menu.svelte";
    import { record } from "$lib/task";
    import type { PaneProps } from "$lib/components/pane";
    import { cn } from "$lib/components/utils";
    import { t } from "$lib/i18n";
    import { onDestroy } from "svelte";
    import type { Cancellable } from "$lib/utils";
    import Tooltip from "./tooltip.svelte";
    import { createTypeReferenceResolver, parseUnit } from "@katana-project/laser";
    import { EditorView } from "@codemirror/view";
    import { ensureSyntaxTree } from "@codemirror/language";
    import { index, jdkRefs } from "$lib/workspace/jdk";
    import { typeResolver } from "./resolver_extension";
    import { Compartment } from "@codemirror/state";

    let { tab, disasms, handler, classes }: PaneProps = $props();
    const entry = $derived(tab.entry!);

    let wrap = $state(get(editorWrap));
    $effect(() => {
        $editorWrap = wrap;
    });

    let usableDisasms = $derived(entry.type === EntryType.MEMBER ? disasms.filter((d) => Boolean(d.method)) : disasms);
    let disasmId = $state($toolsDisasm);
    $effect(() => {
        $toolsDisasm = disasmId;
    });

    const detectedInterp = detectInterpretation(entry);
    let interpType = $state(detectedInterp);
    let interpOptions = $derived({
        type: interpType,
        hexRowBytes: $interpHexRowBytes,
        disasmOptions: $toolsDisasmOptions,
    });

    let disasm = $derived(
        usableDisasms.find((d) => d.id === disasmId) || (entry.type === EntryType.MEMBER ? jasm : vf)
    );
    let language = $derived(detectLanguage(entry, disasm, interpOptions));
    let textSize = $derived(
        $editorTextSizeSync ? editorTextSize : writable(get(editorTextSize) /* immediate value, no subscription */)
    );

    let prevReadTask: Cancellable<string> | null = null;
    let readTask = $derived.by(() => {
        // cancel previous read task
        prevReadTask?.cancel?.();

        return (prevReadTask = read(entry, disasm, interpOptions));
    });

    onDestroy(() => {
        // cancel read task if still running
        readTask.cancel?.();
    });

    let readPromise = $derived(readTask.then(null, () => "")); // swallow errors, this is probably just a CancelledError
    $effect(() => {
        record(interpType !== Interpretation.TEXT ? "task.disasm" : "task.read", entry.name, () => readPromise);
    });

    let view: EditorView | null = $state(null);
    let unit = $derived.by(() => {
        if (
            (interpType !== Interpretation.CLASS && interpType !== Interpretation.TEXT) ||
            language !== "java" ||
            !view
        ) {
            return null;
        }

        const tree = ensureSyntaxTree(view.state, view.state.doc.length, 500);
        if (!tree) {
            // too large of a file to parse, contextual info unavailable
            return null;
        }

        return parseUnit(tree, view.state.doc.toString());
    });
    let resolver = $derived(unit ? createTypeReferenceResolver(unit, [...jdkRefs, ...$classRefs]) : null);

    const resolverStore = new Compartment();

    $effect(() => {
        if (!view) return;

        view.focus();
        view.dispatch({
            effects: resolverStore.reconfigure(typeResolver(resolver, handler, classes, index)),
        });
    });

    let clickPosition = $state({ x: 0, y: 0 });
</script>

<div class="scrollbar-thin relative basis-full overflow-hidden">
    {#await Promise.all([loadLanguage(language), readPromise])}
        <Loading
            value={$t(interpType !== Interpretation.TEXT ? "pane.code.loading.disasm" : "pane.code.loading.read")}
            timed
        />
    {:then [lang, value]}
        <ContextMenu>
            <ContextMenuTrigger onmousedown={(e) => (clickPosition = { x: e.clientX, y: e.clientY })}>
                <CodeEditor
                    bind:view
                    {value}
                    readonly
                    {lang}
                    bind:size={$textSize}
                    {wrap}
                    extensions={[resolverStore.of(typeResolver(resolver, handler, classes, index))]}
                    tooltip={() => [Tooltip, { resolver, classes, handler }]}
                />
            </ContextMenuTrigger>
            <CodeMenu
                bind:view
                {classes}
                {tab}
                {interpType}
                {value}
                lang={language}
                {handler}
                bind:wrap
                bind:sizeSync={$editorTextSizeSync}
                bind:resolver
                bind:mousePosition={clickPosition}
            />
        </ContextMenu>
    {/await}

    <div class="absolute right-0 bottom-0 z-20 m-4 flex flex-row">
        {#if interpType === Interpretation.CLASS}
            <Select type="single" bind:value={disasmId}>
                <SelectTrigger
                    class="!bg-card h-7 rounded-r-none border-r-0 text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4"
                >
                    <span class="text-muted-foreground mr-2">
                        {$t("pane.code.disasm")}
                    </span>
                    <span class="tracking-tight">{disasm.name || disasm.id}</span>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" side="top" align="end">
                    {#each usableDisasms as dism (dism.id)}
                        <SelectItem value={dism.id} label={dism.id} class="justify-between text-xs tracking-tight">
                            <span>{dism.name || dism.id}</span>
                            {#if dism.version}<span class="text-muted-foreground">{dism.version}</span>{/if}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        {/if}
        <Popover>
            <PopoverTrigger>
                <Button
                    variant="outline"
                    size="icon"
                    class={cn("!bg-card", interpType === Interpretation.CLASS && "rounded-l-none")}
                >
                    <SquareCode />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" class="w-64">
                <div class="flex flex-col gap-2">
                    <div class="text-xs">{$t("pane.code.interp")}</div>
                    <Select type="single" bind:value={interpType}>
                        <SelectTrigger class="h-7 w-full text-xs">
                            <span>
                                {$t(`pane.code.interp.${interpType}`)}
                                {#if interpType === detectedInterp}
                                    <span class="text-muted-foreground">
                                        {$t("pane.code.interp.detected")}
                                    </span>
                                {/if}
                            </span>
                        </SelectTrigger>
                        <SelectContent side="top" align="end">
                            {#each Object.values(Interpretation) as type (type)}
                                <SelectItem value={type} class="text-xs" disabled={!canInterpret(entry, type)}>
                                    <span>
                                        {$t(`pane.code.interp.${type}`)}
                                        {#if type === detectedInterp}
                                            <span class="text-muted-foreground">
                                                {$t("pane.code.interp.detected")}
                                            </span>
                                        {/if}
                                    </span>
                                </SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
            </PopoverContent>
        </Popover>
    </div>
</div>
