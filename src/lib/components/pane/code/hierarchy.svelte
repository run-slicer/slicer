<script lang="ts">
    import { ChevronRight, ChevronDown } from "@lucide/svelte";
    import { VList } from "virtua/svelte";
    import { Class, entryIcon, Interface } from "$lib/components/icons";
    import type { EventHandler } from "$lib/event";
    import { cn } from "$lib/components/utils";
    import { type IGraphNode, IGraphNodeType, IMPLICIT_SUPER, graph } from "$lib/workspace/analysis/graph";
    import { prettyInternalName } from "$lib/utils";

    interface Props {
        open: boolean;
        name: string | null;
        handler: EventHandler;
    }

    let { open = $bindable(), name, handler }: Props = $props();
    let data = $derived(open && name ? ($graph[name] ?? null) : null);

    type TreeRow = {
        node: IGraphNode;
        depth: number;
    };

    // if we're viewing an implicit super class, don't hide any implicit supers
    // this likely will be pretty ugly, but it's better than showing an empty tree
    let implicitSuper = $derived(data && IMPLICIT_SUPER.has(data.name) ? new Set() : IMPLICIT_SUPER);
    let relations = $derived(data?.relations($graph, (n) => !implicitSuper.has(n.name)) ?? []);
    let expandedNodes = $derived(relations.map((n) => n.name));

    const getChildren = (node: IGraphNode): IGraphNode[] => {
        const children: IGraphNode[] = [];
        for (const relatedNode of relations) {
            if (relatedNode.superClass?.to === node) {
                children.push(relatedNode);
            } else {
                for (const itfEdge of relatedNode.interfaces) {
                    if (itfEdge.to === node) {
                        children.push(relatedNode);
                        break;
                    }
                }
            }
        }
        return children;
    };

    const toggleExpanded = (id: string) => {
        if (expandedNodes.includes(id)) {
            expandedNodes = expandedNodes.filter((n) => n !== id);
        } else {
            expandedNodes = [...expandedNodes, id];
        }
    };

    let rows = $derived.by(() => {
        if (!data) return [];

        const out: TreeRow[] = [];

        const walk = (node: IGraphNode, depth: number) => {
            out.push({ node, depth });

            if (!expandedNodes.includes(node.name)) {
                return;
            }

            const children = getChildren(node);
            for (const child of children) {
                walk(child, depth + 1);
            }
        };

        walk(data, 0);
        return out;
    });
</script>

{#if data}
    <div class="flex h-full min-h-0 flex-1 flex-col">
        <VList data={rows} itemSize={28} class="h-full overflow-x-hidden p-2">
            {#snippet children({ node, depth })}
                {@const nodeChildren = getChildren(node)}
                {@const hasChildren = nodeChildren.length > 0}

                {@const Chevron = expandedNodes.includes(node.name) ? ChevronDown : ChevronRight}
                {@const { icon: Icon, classes: iconClasses } = node.entry
                    ? entryIcon(node.entry)
                    : node.type === IGraphNodeType.INTERFACE
                      ? { icon: Interface }
                      : { icon: Class }}

                <div
                    role="button"
                    tabindex="-1"
                    ondblclick={() => {
                        if (node.entry) {
                            open = false;
                            handler.open(node.entry);
                        }
                    }}
                    class={cn(
                        "hover:bg-accent/50 focus:bg-accent flex w-full cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-left text-sm transition-colors",
                        node.entry || "cursor-not-allowed"
                    )}
                    style="padding-left: {depth * 16 + 4}px;"
                >
                    <button
                        onclick={() => {
                            if (hasChildren) {
                                toggleExpanded(node.name);
                            }
                        }}
                        class="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center"
                    >
                        {#if hasChildren}
                            <Chevron class="text-muted-foreground h-3.5 w-3.5" />
                        {/if}
                    </button>

                    <span class="flex h-4 w-4 shrink-0 items-center justify-center">
                        <Icon class={cn("h-4 w-4", iconClasses)} />
                    </span>

                    <span class={cn("text-foreground shrink-0 truncate font-medium", node.entry || "text-destructive")}>
                        {prettyInternalName(node.name.split("/").pop() || "")}
                    </span>
                    <span class="text-muted-foreground ml-1 truncate text-xs">
                        {prettyInternalName(node.name)}
                    </span>
                </div>
            {/snippet}
        </VList>
    </div>
{/if}
