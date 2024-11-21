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
    import type { ActionHandler } from "$lib/action";
    import { record } from "$lib/task";

    interface Props {
        tab: Tab;
        disasms: Disassembler[];
        onaction?: ActionHandler;
    }

    let { tab, disasms, onaction }: Props = $props();

    const entry = $derived(tab.entry!);
    const shouldDisasm = $derived(entry.type === EntryType.CLASS && tab.type === TabType.CODE);

    let disasmId = $state($toolsDisasm);
    $effect(() => {
        $toolsDisasm = disasmId;
    });

    let disasm = $derived(disasms.find((d) => d.id === disasmId) || vf);
    let language = $derived(detectLanguage(tab.type, entry, disasm));
    let textSize = $derived(
        $editorTextSizeSync ? editorTextSize : writable(get(editorTextSize) /* immediate value, no subscription */)
    );

    let loadPromise = $derived(Promise.all([loadLanguage(language), read(tab.type, entry, disasm)]));
    $effect(() => {
        record(shouldDisasm ? "disassembling" : "reading", entry.name, () => loadPromise);
    });
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await loadPromise}
        <Loading value={shouldDisasm ? "Disassembling..." : "Reading..."} />
    {:then [lang, value]}
        <ContextMenu>
            <ContextMenuTrigger>
                <CodeEditor {value} readonly {lang} bind:size={$textSize} wrap={$editorWrap} />
            </ContextMenuTrigger>
            <CodeMenu {tab} {value} lang={language} {onaction} />
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
