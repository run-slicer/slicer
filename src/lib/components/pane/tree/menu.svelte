<script lang="ts">
    import { Download, FileInput, GitBranchPlus, Trash2 } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { TabType } from "$lib/tab";
    import type { Node } from "./";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuLabel,
        ContextMenuSeparator,
    } from "$lib/components/ui/context-menu";

    export let data: Node;

    const dispatch = createEventDispatcher();
</script>

<ContextMenuContent class="no-shadow min-w-[12rem] max-w-[16rem]">
    <ContextMenuLabel class="overflow-hidden text-ellipsis text-center">{data.label}</ContextMenuLabel>
    <ContextMenuSeparator />
    {#if data.entry}
        <ContextMenuItem class="flex justify-between" on:click={() => dispatch("open", { data, type: TabType.CODE })}>
            Open <FileInput size={16} />
        </ContextMenuItem>
        <ContextMenuItem
            class="flex justify-between"
            on:click={() => dispatch("open", { data, type: TabType.FLOW_GRAPH })}
        >
            Open flow graph <GitBranchPlus size={16} />
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem class="flex justify-between" on:click={() => dispatch("download", data)}>
            Download <Download size={16} />
        </ContextMenuItem>
    {/if}
    <ContextMenuItem
        class="flex justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
        on:click={() => dispatch("delete", data)}
    >
        Delete <Trash2 size={16} />
    </ContextMenuItem>
</ContextMenuContent>
