<script lang="ts">
    import type { Tab } from "$lib/tab";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
    } from "$lib/components/ui/context-menu";
    import { Binary, Code } from "lucide-svelte";
    import { type ActionHandler, ActionType, type EntryAction } from "$lib/action";
    import type { Language } from "$lib/lang";
    import { createTextEntry, isDisassembled } from "./";

    interface Props {
        tab: Tab;
        lang: Language;
        value: string;
        onaction?: ActionHandler;
    }

    let { tab, lang, value, onaction }: Props = $props();

    let entry = $derived(tab.entry!);

    const handleRaw = () => onaction?.({ type: ActionType.EXPORT, entry } as EntryAction);
    const handleDisasm = () => {
        onaction?.({ type: ActionType.EXPORT, entry: createTextEntry(entry, lang, value) } as EntryAction);
    };
</script>

<ContextMenuContent class="w-[12rem]">
    <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-[12rem]">
            <ContextMenuItem class="flex justify-between" onclick={handleRaw}>
                Raw <Binary size={16} />
            </ContextMenuItem>
            <ContextMenuItem
                class="flex justify-between"
                disabled={!isDisassembled(tab.type, entry)}
                onclick={handleDisasm}
            >
                Disassembled <Code size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>
