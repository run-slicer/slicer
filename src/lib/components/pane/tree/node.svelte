<script lang="ts" module>
    import type { Entry } from "$lib/workspace";

    export interface Node {
        label: string;
        entry?: Entry;
        parent?: Node;
        nodes?: Node[];
        expanded?: boolean;
    }
</script>

<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";
    import TreeNode from "./node.svelte";
    import { ChevronDown, ChevronRight, Folder } from "lucide-svelte";
    import { cn } from "$lib/components/utils";
    import { fileIcon } from "$lib/components/icons";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        data: Node;
        onopen?: (data: Node) => void;
        onmenu?: (e: MouseEvent, data: Node) => void;
    }

    let { data = $bindable(), onopen, onmenu, ...rest }: Props = $props();
    $effect(() => {
        // no children and not a leaf node, remove ourselves from the parent
        if (data.parent && !data.nodes && !data.entry) {
            data.parent.nodes = data.parent?.nodes?.filter((n) => n.label === data.label);
        }
    });

    const { icon: FileIcon, classes } = $derived(fileIcon(data.label));

    let expanded = $state(data.expanded === undefined ? (data.parent?.nodes?.length || 0) === 1 : data.expanded);
    $effect(() => {
        data.expanded = expanded;
    });

    let hasNonLeaf = $derived(!data.nodes || data.nodes.some((n) => n.nodes));
    let sortedNodes = $derived(data.nodes?.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes)));

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        onmenu?.(new MouseEvent(e.type, e) /* clone */, data);
    };
</script>

<div role="button" tabindex="0" oncontextmenu={handleContextMenu} class="contain-layout contain-style" {...rest}>
    {#if sortedNodes}
        {@const ExpandedIcon = expanded ? ChevronDown : ChevronRight}
        <button class="highlight flex w-full py-[0.2rem]" onclick={() => (expanded = !expanded)}>
            <ExpandedIcon size={14} class="my-auto mr-1 min-w-[14px] text-muted-foreground" />
            {#if data.entry}
                <FileIcon size={16} class={cn("my-auto mr-1 min-w-[16px]", classes)} />
            {:else}
                <Folder size={16} class="my-auto mr-1 min-w-[16px] fill-muted" />
            {/if}
            <span class="text-sm">{data.label}</span>
        </button>
        {#if expanded}
            {#each sortedNodes as node (node.label)}
                <TreeNode
                    data={node}
                    {onopen}
                    {onmenu}
                    class={cn("border-l border-l-border pl-[1.125rem]", hasNonLeaf || "pl-[2.25rem]")}
                />
            {/each}
        {/if}
    {:else}
        <button class="highlight flex w-full py-[0.2rem]" onclick={() => onopen?.(data)}>
            <FileIcon size={16} class={cn("my-auto mr-1 min-w-[16px]", classes)} />
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
