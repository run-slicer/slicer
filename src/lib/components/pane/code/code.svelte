<svelte:options immutable />

<script lang="ts">
    import { EntryType } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, TabType } from "$lib/tab";
    import { load as loadLanguage } from "$lib/lang";
    import { detectLanguage, read } from "./";
    import { CodeEditor } from "$lib/components/editor";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { vf } from "$lib/disasm/builtin";
    import { toolsDisasm, editorTextSize, editorTextSizeSync, editorWrap } from "$lib/state";
    import { get, writable } from "svelte/store";
    import type { Disassembler } from "$lib/disasm";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import CodeMenu from "./menu.svelte";

    export let tab: Tab;
    const entry = tab.entry!;

    const shouldDisasm = entry.type === EntryType.CLASS && tab.type === TabType.CODE;

    export let disasms: Disassembler[];

    let disasmId = $toolsDisasm;
    $: $toolsDisasm = disasmId;

    $: disasm = disasms.find((d) => d.id === disasmId) || vf;

    $: language = detectLanguage(tab.type, entry, disasm);

    $: textSize = $editorTextSizeSync
        ? editorTextSize
        : writable(get(editorTextSize) /* immediate value, no subscription */);
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([loadLanguage(language), read(tab.type, entry, disasm)])}
        <Loading value={shouldDisasm ? "Disassembling..." : "Reading..."} />
    {:then [lang, value]}
        <ContextMenu>
            <ContextMenuTrigger>
                <CodeEditor {value} readOnly {lang} bind:textSize={$textSize} wrap={$editorWrap} />
            </ContextMenuTrigger>
            <CodeMenu {tab} {value} lang={language} on:action />
        </ContextMenu>
    {/await}
    {#if shouldDisasm}
        <div class="absolute bottom-0 right-0 z-20 m-[15px]">
            <Select type="single" bind:value={disasmId}>
                <SelectTrigger class="h-7 text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <span class="mr-2 text-muted-foreground">Disassembler: </span>
                    <span class="tracking-tight">{disasm.name || disasm.id}</span>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" align="end">
                    {#each disasms as dism}
                        <SelectItem value={dism.id} label={dism.id} class="text-xs tracking-tight">
                            {dism.name || dism.id}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    {/if}
</div>
