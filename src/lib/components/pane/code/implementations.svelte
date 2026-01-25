<script lang="ts">
    import { ChevronRight, ChevronDown } from "@lucide/svelte";
    import { VList } from "virtua/svelte";
    import { entryIcon } from "$lib/components/icons";
    import { EntryType, type ClassEntry, type Entry } from "$lib/workspace";
    import type { EventHandler } from "$lib/event";
    import type { ImplementationTreeNode } from "./inheritance";
    import { cn } from "$lib/components/utils";

    interface Props {
        data: ImplementationTreeNode | null;
        open: boolean;
        handler: EventHandler;
        classes: Map<string, Entry>;
    }

    let { data, open = $bindable(), handler, classes }: Props = $props();

    let selectedEntry = $state.raw<ClassEntry | undefined>(undefined);

    let expandedNodes = $state<Set<string>>(new Set());

    type TreeRow = {
        node: ImplementationTreeNode;
        depth: number;
    };

    $effect(() => {
        if (!data) return;

        const ids = new Set<string>();
        (function collect(node: ImplementationTreeNode) {
            ids.add(node.entry.name);
            node.children.forEach(collect);
        })(data);

        expandedNodes = ids;
    });

    const toggleExpanded = (id: string) => {
        const next = new Set(expandedNodes);
        next.has(id) ? next.delete(id) : next.add(id);
        expandedNodes = next;
    }

    const getSimpleName = (entry: ClassEntry): string => {
        const full = entry.node.thisClass.nameEntry?.string ?? "";
        const parts = full.split(/[./$]/);
        return parts.at(-1) || full;
    }

    const getFullName = (entry: ClassEntry): string => {
        return entry.node.thisClass.nameEntry?.string ?? "";
    }

    const countDescendants = (node: ImplementationTreeNode): number => {
        return node.children.reduce(
            (acc, child) => acc + 1 + countDescendants(child),
            0
        );
    }

    let rows = $derived.by(() => {
        if (!data) return [];

        const out: TreeRow[] = [];

        const walk = (node: ImplementationTreeNode, depth: number) => {
            out.push({ node, depth });

            if (!expandedNodes.has(node.entry.name)) return;

            for (const child of node.children) {
                walk(child, depth + 1);
            }
        }

        walk(data, 0);
        return out;
    });
</script>

{#snippet treeRow({ node, depth }: TreeRow)}
    {@const hasChildren = node.children.length > 0}
    {@const isExpanded = expandedNodes.has(node.entry.name)}
    {@const isSelected = selectedEntry?.name === node.entry.name}
    {@const iconInfo = entryIcon(node.entry)}
    {@const Icon = iconInfo.icon}
    {@const simpleName = getSimpleName(node.entry)}
    {@const fullName = getFullName(node.entry)}

    <button
        type="button"
        onclick={() => {
            if (hasChildren) toggleExpanded(node.entry.name);
            selectedEntry = node.entry;
        }}
        ondblclick={() => {
            open = false;
            handler.open(node.entry);
        }}
        class={cn(
            "hover:bg-accent/50 flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-left text-sm transition-colors",
            isSelected && "bg-accent"
        )}
        style="padding-left: {depth * 16 + 4}px;"
    >
        <span class="flex h-4 w-4 shrink-0 items-center justify-center">
            {#if hasChildren}
                {#if isExpanded}
                    <ChevronDown class="text-muted-foreground h-3.5 w-3.5" />
                {:else}
                    <ChevronRight class="text-muted-foreground h-3.5 w-3.5" />
                {/if}
            {/if}
        </span>

        <span class="flex h-4 w-4 shrink-0 items-center justify-center">
            <Icon class={cn("h-4 w-4", iconInfo.classes)} fill="currentColor" />
        </span>

        <span class="text-foreground truncate font-medium shrink-0">
            {simpleName}
        </span>
        <span class="text-muted-foreground ml-1 truncate text-xs">
            {fullName}
        </span>
    </button>
{/snippet}

<div class="divide-border flex h-full flex-col divide-y">
    {#if data}
        <div class="bg-muted/30 flex items-center gap-2 px-3 py-1.5">
            <span class="text-muted-foreground text-xs">
                {countDescendants(data)} implementations
            </span>
        </div>

        <div class="min-h-0 flex-1">
            <VList
                data={rows}
                itemSize={28}
                getKey={(row) => row.node.entry.name}
                class="h-full overflow-x-hidden pb-2"
            >
                {#snippet children(row)}
                    {@render treeRow(row)}
                {/snippet}
            </VList>
        </div>
    {/if}
</div>
