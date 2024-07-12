<script lang="ts">
    import { Trash2 } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
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
    <ContextMenuItem
        class="flex justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
        on:click={() => dispatch("delete", data)}
    >
        Delete <Trash2 size="16" />
    </ContextMenuItem>
</ContextMenuContent>
