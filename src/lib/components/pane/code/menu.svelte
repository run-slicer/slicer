<script lang="ts">
    import type { Tab } from "$lib/tab";
    import { transformEntry } from "$lib/workspace";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
    } from "$lib/components/ui/context-menu";
    import { Binary, Code } from "lucide-svelte";
    import { type Language, toExtension } from "$lib/lang";
    import { isDisassembled } from "./";
    import type { EventHandler } from "$lib/event";

    interface Props {
        tab: Tab;
        lang: Language;
        value: string;
        handler: EventHandler;
    }

    let { tab, lang, value, handler }: Props = $props();
    let entry = $derived(tab.entry!);
</script>

<ContextMenuContent class="w-[12rem]">
    <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-[12rem]">
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
