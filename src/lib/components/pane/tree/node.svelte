<script lang="ts" context="module">
    import type { Entry } from "$lib/workspace";
    import { writable } from "svelte/store";

    export interface Node {
        label: string;
        entry?: Entry;
        parent?: Node;
        nodes?: Node[];
        expanded?: boolean;
    }

    export let currentMenu = writable({});
</script>

<script lang="ts">
    import { ChevronDown, ChevronRight, Folder, Trash2 } from "lucide-svelte";
    import { open } from "$lib/action/open";
    import { remove } from "$lib/action/remove";
    import { cn } from "$lib/utils";
    import { pickIcon } from "./icons";
    import {
        ContextMenu,
        ContextMenuTrigger,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuLabel,
        ContextMenuSeparator,
    } from "$lib/components/ui/context-menu";

    export let data: Node;
    $: {
        // no children and not a leaf node, remove ourselves from the parent
        if (data.parent && !data.nodes && !data.entry) {
            data.parent.nodes = data.parent?.nodes?.filter((n) => n.label === data.label);
        }
    }

    let expanded = data.expanded;
    $: data.expanded = expanded;

    let hasNonLeaf = false;
    $: {
        hasNonLeaf = !data.nodes || data.nodes.some((n) => n.nodes);
        if (data.nodes) {
            // non-leaf nodes go first
            data.nodes.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes));
        }
    }

    const openEntry = () => open(data.entry!);
    const deleteEntry = () => remove(data.entry!);

    // this is a god-awful way to have only one context menu open at a time,
    // but I do not care anymore - this works
    const menuId = {};
    const setOpened = (open: boolean) => {
        if (open) {
            $currentMenu = menuId;
        }
    };
</script>

<div {...$$restProps}>
    {#if data.nodes}
        <button on:click={() => (expanded = !expanded)} class="highlight flex w-full py-[0.2rem]">
            <svelte:component
                this={expanded ? ChevronDown : ChevronRight}
                size={14}
                class="my-auto mr-1 text-muted-foreground"
            />
            <Folder size={16} class="my-auto mr-1 fill-muted" />
            <span class="text-sm">{data.label}</span>
        </button>
        {#if expanded}
            {#each data.nodes as node (node.label)}
                <svelte:self bind:data={node} class={cn("ml-0.5 pl-[16px]", hasNonLeaf || "ml-1 pl-[32px]")} />
            {/each}
        {/if}
    {:else}
        {@const { icon, classes } = pickIcon(data.label)}
        <ContextMenu open={$currentMenu === menuId} onOpenChange={setOpened}>
            <ContextMenuTrigger>
                <button class="highlight flex w-full py-[0.2rem]" on:click={openEntry}>
                    <svelte:component this={icon} size="16" class={cn("my-auto mr-1 min-w-[16px]", classes)} />
                    <span class="text-sm">{data.label}</span>
                </button>
            </ContextMenuTrigger>
            <ContextMenuContent class="min-w-[12rem] max-w-[16rem]">
                <ContextMenuLabel class="overflow-hidden text-ellipsis text-center">{data.label}</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem
                    class="flex justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                    on:click={deleteEntry}
                >
                    Delete <Trash2 size="16" class="mr-1" />
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    {/if}
</div>

<style>
    .highlight:hover {
        border-image: conic-gradient(hsl(var(--accent) / 0.4) 0, hsl(var(--accent) / 0.4) 0) fill 0/0/0 100vw;
    }

    .highlight:focus {
        border-image: conic-gradient(hsl(var(--accent)) 0, hsl(var(--accent)) 0) fill 0/0/0 100vw;
    }
</style>
