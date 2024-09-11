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
    import { createEventDispatcher } from "svelte";
    import { ActionType } from "$lib/action";
    import type { Language } from "$lib/lang";
    import { createTextEntry, isDisassembled } from "./";

    export let tab: Tab;
    let entry = tab.entry!;

    export let lang: Language;
    export let value: string;

    const dispatch = createEventDispatcher();
</script>

<ContextMenuContent class="w-[12rem]">
    <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-[12rem]">
            <ContextMenuItem
                class="flex justify-between"
                on:click={() => dispatch("action", { type: ActionType.EXPORT, entry })}
            >
                Raw <Binary size={16} />
            </ContextMenuItem>
            <ContextMenuItem
                class="flex justify-between"
                disabled={!isDisassembled(tab.type, entry)}
                on:click={() =>
                    dispatch("action", { type: ActionType.EXPORT, entry: createTextEntry(entry, lang, value) })}
            >
                Disassembled <Code size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>
