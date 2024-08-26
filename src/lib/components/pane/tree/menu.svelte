<script lang="ts">
    import { Binary, Code, Download, GitBranchPlus, Trash2 } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { TabType } from "$lib/tab";
    import type { Node } from "./";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuLabel,
        ContextMenuSeparator,
        ContextMenuSub,
        ContextMenuSubTrigger,
        ContextMenuSubContent,
    } from "$lib/components/ui/context-menu";
    import { EntryType } from "$lib/workspace";

    export let data: Node;

    const dispatch = createEventDispatcher();
</script>

<ContextMenuContent class="no-shadow min-w-[12rem] max-w-[16rem]">
    <ContextMenuLabel class="overflow-hidden text-ellipsis text-center">{data.label}</ContextMenuLabel>
    <ContextMenuSeparator />
    {#if data.entry}
        {#if data.entry.type === EntryType.FILE}
            <ContextMenuSub>
                <ContextMenuSubTrigger>Open as</ContextMenuSubTrigger>
                <ContextMenuSubContent class="w-[12rem]">
                    <ContextMenuItem
                        class="flex justify-between"
                        on:click={() => dispatch("action", { type: "open", data, tabType: TabType.CODE })}
                    >
                        Code <Code size={16} />
                    </ContextMenuItem>
                    <ContextMenuItem
                        class="flex justify-between"
                        on:click={() => dispatch("action", { type: "open", data, tabType: TabType.HEX })}
                    >
                        Hexadecimal <Binary size={16} />
                    </ContextMenuItem>
                    <ContextMenuItem
                        class="flex justify-between"
                        on:click={() => dispatch("action", { type: "open", data, tabType: TabType.FLOW_GRAPH })}
                    >
                        Flow graph <GitBranchPlus size={16} />
                    </ContextMenuItem>
                </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
        {/if}
        <ContextMenuItem class="flex justify-between" on:click={() => dispatch("action", { type: "download", data })}>
            Download <Download size={16} />
        </ContextMenuItem>
    {/if}
    <ContextMenuItem
        class="flex justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
        on:click={() => dispatch("action", { type: "delete", data })}
    >
        Delete <Trash2 size={16} />
    </ContextMenuItem>
</ContextMenuContent>
