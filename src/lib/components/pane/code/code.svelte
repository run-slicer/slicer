<svelte:options immutable />

<script lang="ts">
    import { EntryType } from "$lib/workspace";
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, TabType } from "$lib/tab";
    import { load as loadLanguage } from "$lib/lang";
    import { detectLanguage, read } from "./";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { all as disasms } from "$lib/disasm";
    import vf from "$lib/disasm/vf";
    import { toolsDisasm, editorTextSize, editorTextSizeSync } from "$lib/state";
    import { get, writable } from "svelte/store";

    export let tab: Tab;
    let entry = tab.entry!;

    const shouldDisasm = entry.type === EntryType.CLASS && tab.type === TabType.CODE;

    const initialDisasm = $toolsDisasm;

    $: disasmProto = { value: initialDisasm, label: initialDisasm };

    $: $toolsDisasm = disasmProto.value;
    $: disasm = disasms.get(disasmProto.value) || vf;

    $: language = detectLanguage(tab.type, entry, disasm);

    $: textSize = $editorTextSizeSync
        ? editorTextSize
        : writable<number>(get(editorTextSize) /* immediate value, no subscription */);
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([import("./editor.svelte"), loadLanguage(language), read(tab.type, entry, disasm)])}
        <Loading value={shouldDisasm ? "Disassembling..." : "Reading..."} overlay />
    {:then [editor, lang, value]}
        <svelte:component this={editor.default} {value} readOnly {lang} bind:textSize={$textSize} />
    {/await}
    {#if shouldDisasm}
        <div class="absolute bottom-0 right-0 m-[15px]">
            <Select bind:selected={disasmProto}>
                <SelectTrigger class="h-7 text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <span class="mr-2 text-muted-foreground">Disassembler: </span>
                    <span class="tracking-tight">{disasm.name || disasm.id}</span>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll">
                    {#each disasms.values() as dism}
                        <SelectItem value={dism.id} label={dism.id} class="text-xs tracking-tight">
                            {dism.name || dism.id}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    {/if}
</div>
