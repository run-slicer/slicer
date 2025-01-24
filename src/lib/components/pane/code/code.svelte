<script lang="ts">
    import { EntryType } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, TabType } from "$lib/tab";
    import { load as loadLanguage } from "$lib/lang";
    import { detectLanguage, read } from "./";
    import CodeEditor from "$lib/components/editor/editor.svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { jasm, vf } from "$lib/disasm/builtin";
    import { editorTextSize, editorTextSizeSync, editorWrap, toolsDisasm } from "$lib/state";
    import { get, writable } from "svelte/store";
    import type { Disassembler } from "$lib/disasm";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import CodeMenu from "./menu.svelte";
    import { record } from "$lib/task";
    import type { EventHandler } from "$lib/event";

    interface Props {
        tab: Tab;
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { tab, disasms, handler }: Props = $props();
    const entry = $derived(tab.entry!);

    let wrap = $state(get(editorWrap));
    $effect(() => {
        $editorWrap = wrap;
    });

    let usableDisasms = $derived(entry.type === EntryType.MEMBER ? disasms.filter((d) => Boolean(d.method)) : disasms);
    const shouldDisasm = $derived(
        tab.type === TabType.CODE && (entry.type === EntryType.CLASS || entry.type === EntryType.MEMBER)
    );

    let disasmId = $state($toolsDisasm);
    $effect(() => {
        $toolsDisasm = disasmId;
    });

    let disasm = $derived(
        usableDisasms.find((d) => d.id === disasmId) || (entry.type === EntryType.MEMBER ? jasm : vf)
    );
    let language = $derived(detectLanguage(tab.type, entry, disasm));
    let textSize = $derived(
        $editorTextSizeSync ? editorTextSize : writable(get(editorTextSize) /* immediate value, no subscription */)
    );

    let readPromise = $derived(read(tab.type, entry, disasm));
    $effect(() => {
        record(shouldDisasm ? "disassembling" : "reading", entry.name, () => readPromise);
    });
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([loadLanguage(language), readPromise])}
        <Loading value={shouldDisasm ? "Disassembling..." : "Reading..."} />
    {:then [lang, value]}
        <ContextMenu>
            <ContextMenuTrigger>
                <CodeEditor {value} readonly {lang} bind:size={$textSize} {wrap} />
            </ContextMenuTrigger>
            <CodeMenu {tab} {value} lang={language} {handler} bind:wrap />
        </ContextMenu>
    {/await}
    {#if shouldDisasm}
        <div class="absolute bottom-0 right-0 z-20 m-[15px]">
            <Select type="single" bind:value={disasmId}>
                <SelectTrigger class="h-7 text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <span class="mr-2 text-muted-foreground">Disassembler: </span>
                    <span class="tracking-tight">{disasm.name || disasm.id}</span>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" side="top" align="end">
                    {#each usableDisasms as dism (dism.id)}
                        <SelectItem value={dism.id} label={dism.id} class="text-xs tracking-tight">
                            {dism.name || dism.id}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    {/if}
</div>
