<script lang="ts">
    import type { Tab } from "$lib/tab";
    import { transformEntry } from "$lib/workspace";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuCheckboxItem,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
        ContextMenuSeparator,
    } from "$lib/components/ui/context-menu";
    import ContextMenuLabel from "$lib/components/menu_label.svelte";
    import { Binary, CaseSensitive, Code, WrapText } from "@lucide/svelte";
    import { type Language, toExtension } from "$lib/lang";
    import { isDisassembled } from "./";
    import type { EventHandler } from "$lib/event";

    interface Props {
        tab: Tab;
        lang: Language;
        value: string;
        wrap: boolean;
        sizeSync: boolean;
        handler: EventHandler;
    }

    let { tab, lang, value, handler, wrap = $bindable(), sizeSync = $bindable() }: Props = $props();
    let entry = $derived(tab.entry!);
</script>

<ContextMenuContent class="w-48">
    <ContextMenuLabel inset>Editor</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuCheckboxItem class="justify-between" bind:checked={wrap}>
        Wrap lines <WrapText size={16} />
    </ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem class="justify-between" bind:checked={sizeSync}>
        Lock zoom <CaseSensitive size={16} />
    </ContextMenuCheckboxItem>
    <ContextMenuSeparator />
    <ContextMenuLabel inset>File</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuSub>
        <ContextMenuSubTrigger inset>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
            <ContextMenuItem class="flex justify-between" onclick={() => handler.export([entry])}>
                Raw <Binary size={16} />
            </ContextMenuItem>
            <ContextMenuItem
                class="flex justify-between"
                disabled={!isDisassembled(tab.type, entry)}
                onclick={() => handler.export([transformEntry(entry, toExtension(lang), value)])}
            >
                Disassembled <Code size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>
