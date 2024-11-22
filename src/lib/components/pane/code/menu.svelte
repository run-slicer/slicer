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
    import { type ActionHandler, ActionType, type ExportAction } from "$lib/action";
    import { type Language, toExtension } from "$lib/lang";
    import { isDisassembled } from "./";

    interface Props {
        tab: Tab;
        lang: Language;
        value: string;
        onaction?: ActionHandler;
    }

    let { tab, lang, value, onaction }: Props = $props();

    let entry = $derived(tab.entry!);

    const handleRaw = () => onaction?.({ type: ActionType.EXPORT, entries: [entry] } as ExportAction);
    const handleDisasm = () => {
        onaction?.({
            type: ActionType.EXPORT,
            entries: [transformEntry(entry, toExtension(lang), value)],
        } as ExportAction);
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
