<script lang="ts">
    import { Binary, Code, Download, Gauge, GitBranchPlus, Image, Trash2 } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { EntryType } from "$lib/workspace";
    import { TabType } from "$lib/tab";
    import { ActionType } from "$lib/action";
    import { collectEntries } from "./tree.svelte";
    import type { Node } from "./";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuSub,
        ContextMenuSubTrigger,
        ContextMenuSubContent,
    } from "$lib/components/ui/context-menu";

    export let node: Node;

    const dispatch = createEventDispatcher();

    const dispatchOpen = (tabType: TabType) => {
        dispatch("action", { type: ActionType.OPEN, entry: node.entry!, tabType });
    };
</script>

<ContextMenuContent class="min-w-[12rem] max-w-[16rem]">
    <!-- TODO: use context menu label -->
    <div class="overflow-hidden text-ellipsis px-2 py-1.5 text-center text-sm font-semibold text-foreground">
        {node.label}
    </div>
    <ContextMenuSeparator />
    {#if node.entry}
        <ContextMenuSub>
            <ContextMenuSubTrigger>Open as</ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-[12rem]">
                {#if node.entry.type !== EntryType.ARCHIVE}
                    <ContextMenuItem class="flex justify-between" onclick={() => dispatchOpen(TabType.CODE)}>
                        Code <Code size={16} />
                    </ContextMenuItem>
                {/if}
                <ContextMenuItem class="flex justify-between" onclick={() => dispatchOpen(TabType.HEX)}>
                    Hexadecimal <Binary size={16} />
                </ContextMenuItem>
                <ContextMenuItem class="flex justify-between" onclick={() => dispatchOpen(TabType.IMAGE)}>
                    Image <Image size={16} />
                </ContextMenuItem>
                {#if node.entry.type !== EntryType.ARCHIVE}
                    <ContextMenuItem class="flex justify-between" onclick={() => dispatchOpen(TabType.FLOW_GRAPH)}>
                        Flow graph <GitBranchPlus size={16} />
                    </ContextMenuItem>
                {/if}
                <ContextMenuItem class="flex justify-between" onclick={() => dispatchOpen(TabType.HEAP_DUMP)}>
                    Heap dump <Gauge size={16} />
                </ContextMenuItem>
            </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem
            class="flex justify-between"
            onclick={() => dispatch("action", { type: ActionType.EXPORT, entry: node.entry })}
        >
            Download <Download size={16} />
        </ContextMenuItem>
    {/if}
    <ContextMenuItem
        class="flex justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
        onclick={() => dispatch("action", { type: ActionType.REMOVE, entries: collectEntries(node) })}
    >
        Delete <Trash2 size={16} />
    </ContextMenuItem>
</ContextMenuContent>
