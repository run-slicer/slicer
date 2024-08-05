<script lang="ts" context="module">
    import { writable } from "svelte/store";

    export let currentMenu = writable({});
</script>

<script lang="ts">
    import { ChevronDown, ChevronRight, Folder } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { cn } from "$lib/components/utils";
    import { TabType } from "$lib/tab";
    import { fileIcon } from "$lib/components/icons";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import NodeMenu from "./menu.svelte";
    import type { Node } from "./";

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

    // this is a god-awful way to have only one context menu open at a time,
    // but I do not care anymore - this works
    const menuId = {};
    const setOpened = (open: boolean) => {
        if (open) {
            $currentMenu = menuId;
        }
    };

    const dispatch = createEventDispatcher();
</script>

<div {...$$restProps}>
    {#if data.nodes}
        <ContextMenu open={$currentMenu === menuId} onOpenChange={setOpened}>
            <ContextMenuTrigger>
                <button on:click={() => (expanded = !expanded)} class="highlight flex w-full py-[0.2rem]">
                    <svelte:component
                        this={expanded ? ChevronDown : ChevronRight}
                        size={14}
                        class="my-auto mr-1 min-w-[14px] text-muted-foreground"
                    />
                    <Folder size={16} class="my-auto mr-1 min-w-[16px] fill-muted" />
                    <span class="text-sm">{data.label}</span>
                </button>
            </ContextMenuTrigger>
            <NodeMenu {data} on:delete />
        </ContextMenu>
        {#if expanded}
            {#each data.nodes as node (node.label)}
                <svelte:self
                    bind:data={node}
                    on:open
                    on:delete
                    on:download
                    class={cn("ml-0.5 pl-[16px]", hasNonLeaf || "ml-1 pl-[32px]")}
                />
            {/each}
        {/if}
    {:else}
        {@const { icon, classes } = fileIcon(data.label)}
        <ContextMenu open={$currentMenu === menuId} onOpenChange={setOpened}>
            <ContextMenuTrigger>
                <button
                    class="highlight flex w-full py-[0.2rem]"
                    on:click={() => dispatch("open", { data, type: TabType.CODE })}
                >
                    <svelte:component this={icon} size={16} class={cn("my-auto mr-1 min-w-[16px]", classes)} />
                    <span class="text-sm">{data.label}</span>
                </button>
            </ContextMenuTrigger>
            <NodeMenu {data} on:open on:delete on:download />
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
