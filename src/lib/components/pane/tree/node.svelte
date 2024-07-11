<script lang="ts" context="module">
    export interface Node {
        label: string;
        nodes?: Node[];
        action?: () => Promise<void>;
        expanded?: boolean;
    }
</script>

<script lang="ts">
    import { ChevronDown, ChevronRight, Folder } from "lucide-svelte";
    import { cn } from "$lib/utils";
    import { pickIcon } from "./icons";

    export let data: Node;

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
</script>

<div {...$$restProps}>
    {#if data.nodes}
        <button on:click={() => (expanded = !expanded)} class="highlight my-0.5 flex w-full">
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
                <svelte:self
                    bind:data={node}
                    class={cn("pl-[16px]", node.nodes ? "ml-1" : "ml-0.5", hasNonLeaf || "ml-1 pl-[32px]")}
                />
            {/each}
        {/if}
    {:else}
        {@const { icon, classes } = pickIcon(data.label)}
        <button class="highlight my-0.5 flex w-full" on:click={data.action}>
            <svelte:component this={icon} size="16" class={cn("my-auto mr-1 min-w-[16px]", classes)} />
            <span class="text-sm">{data.label}</span>
        </button>
    {/if}
</div>

<style>
    .highlight:focus {
        border-image: conic-gradient(hsl(var(--accent)) 0, hsl(var(--accent)) 0) fill 0/0/0 100vw;
    }
</style>
