<script lang="ts" module>
    import { Interpretation } from "./";

    export const labels: Record<Interpretation, string> = {
        [Interpretation.CLASS]: "Disassembly",
        [Interpretation.HEX]: "Hexadecimal",
        [Interpretation.TEXT]: "Text",
    };
</script>

<script lang="ts">
    import { EntryType } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { load as loadLanguage } from "$lib/lang";
    import { detectLanguage, read, detectInterpretation, canInterpret, interpOptions } from "./";
    import CodeEditor from "$lib/components/editor/editor.svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { ScanEye } from "@lucide/svelte";
    import { jasm, vf } from "$lib/disasm/builtin";
    import { editorTextSize, editorTextSizeSync, editorWrap, toolsDisasm } from "$lib/state";
    import { get, writable } from "svelte/store";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import CodeMenu from "./menu.svelte";
    import { record } from "$lib/task";
    import type { PaneProps } from "$lib/components/pane";

    let { tab, disasms, handler }: PaneProps = $props();
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

    let disasm = $derived(
        usableDisasms.find((d) => d.id === disasmId) || (entry.type === EntryType.MEMBER ? jasm : vf)
    );
    let language = $derived(detectLanguage(interpType, entry, disasm));
    let textSize = $derived(
        $editorTextSizeSync ? editorTextSize : writable(get(editorTextSize) /* immediate value, no subscription */)
    );

    let readPromise = $derived(read(interpType, $interpOptions, entry, disasm));
    $effect(() => {
        record(interpType !== Interpretation.TEXT ? "disassembling" : "reading", entry.name, () => readPromise);
    });
</script>

<div class="scrollbar-thin relative basis-full overflow-hidden">
    {#await Promise.all([loadLanguage(language), readPromise])}
        <Loading value={interpType !== Interpretation.TEXT ? "Disassembling..." : "Reading..."} timed />
    {:then [lang, value]}
        <ContextMenu>
            <ContextMenuTrigger>
                <CodeEditor {value} readonly {lang} bind:size={$textSize} {wrap} />
            </ContextMenuTrigger>
            <CodeMenu
                {tab}
                {interpType}
                {value}
                lang={language}
                {handler}
                bind:wrap
                bind:sizeSync={$editorTextSizeSync}
            />
        </ContextMenu>
    {/await}

    <div class="absolute right-0 bottom-0 z-20 m-4 flex flex-col items-end gap-2">
        <Popover>
            <PopoverTrigger>
                <Button variant="outline" size="icon" class="flex">
                    <ScanEye />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="end" sideOffset={8} class="w-56">
                <div class="flex flex-col gap-2">
                    <div class="text-xs">Interpretation mode</div>
                    <Select type="single" bind:value={interpType}>
                        <SelectTrigger class="h-7 w-full text-xs">
                            <span>
                                {labels[interpType]}
                                {#if interpType === detectedInterp}
                                    <span class="text-muted-foreground">(detected)</span>
                                {/if}
                            </span>
                        </SelectTrigger>
                        <SelectContent side="top" align="end">
                            {#each Object.values(Interpretation) as type (type)}
                                <SelectItem value={type} class="text-xs" disabled={!canInterpret(type, entry)}>
                                    <span>
                                        {labels[type]}
                                        {#if type === detectedInterp}
                                            <span class="text-muted-foreground">(detected)</span>
                                        {/if}
                                    </span>
                                </SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
            </PopoverContent>
        </Popover>
        {#if interpType === Interpretation.CLASS}
            <Select type="single" bind:value={disasmId}>
                <SelectTrigger class="h-7 text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <span class="text-muted-foreground mr-2">Disassembler: </span>
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
    </div>
</div>
