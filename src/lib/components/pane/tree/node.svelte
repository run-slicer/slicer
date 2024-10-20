<script lang="ts">
    import { ChevronDown, ChevronRight, Folder } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { cn } from "$lib/components/utils";
    import { fileIcon } from "$lib/components/icons";
    import type { Node } from "./";

    export let data: Node;
    $: {
        // no children and not a leaf node, remove ourselves from the parent
        if (data.parent && !data.nodes && !data.entry) {
            data.parent.nodes = data.parent?.nodes?.filter((n) => n.label === data.label);
        }
    }

    const { icon, classes } = fileIcon(data.label);

    let expanded = data.expanded === undefined ? (data.parent?.nodes?.length || 0) === 1 : data.expanded;
    $: data.expanded = expanded;

    let hasNonLeaf = false;
    $: {
        hasNonLeaf = !data.nodes || data.nodes.some((n) => n.nodes);
        if (data.nodes && hasNonLeaf) {
            // non-leaf nodes go first
            data.nodes.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes));
        }
    }

    const dispatch = createEventDispatcher();
    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dispatch("contextmenu", { event: new MouseEvent(e.type, e) /* clone */, data });
    };
</script>

<div
    role="button"
    tabindex="0"
    on:contextmenu={handleContextMenu}
    class="contain-layout contain-style"
    {...$$restProps}
>
    {#if data.nodes}
        <button class="highlight flex w-full py-[0.2rem]" on:click={() => (expanded = !expanded)}>
            <svelte:component
                this={expanded ? ChevronDown : ChevronRight}
                size={14}
                class="my-auto mr-1 min-w-[14px] text-muted-foreground"
            />
            {#if data.entry}
                <svelte:component this={icon} size={16} class={cn("my-auto mr-1 min-w-[16px]", classes)} />
            {:else}
                <Folder size={16} class="my-auto mr-1 min-w-[16px] fill-muted" />
            {/if}
            <span class="text-sm">{data.label}</span>
        </button>
        {#if expanded}
            {#each data.nodes as node (node.label)}
                <svelte:self
                    data={node}
                    on:open
                    on:contextmenu
                    class={cn("border-l border-l-border pl-[1.125rem]", hasNonLeaf || "pl-[2.25rem]")}
                />
            {/each}
        {/if}
    {:else}
        <button class="highlight flex w-full py-[0.2rem]" on:click={() => dispatch("open", { data })}>
            <svelte:component this={icon} size={16} class={cn("my-auto mr-1 min-w-[16px]", classes)} />
            <span class="text-sm">{data.label}</span>
        </button>
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
