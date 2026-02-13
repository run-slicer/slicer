<script lang="ts">
    import { ChevronDown, ChevronRight } from "@lucide/svelte";
    import { VList } from "virtua/svelte";
    import { Class, entryIcon, Interface } from "$lib/components/icons";
    import type { EventHandler } from "$lib/event";
    import { cn } from "$lib/components/utils";
    import { inheritanceGraph, type IGraphNode, IGraphNodeType, WalkDirection } from "$lib/workspace/analysis/graph";
    import { prettyInternalName } from "$lib/utils";
    import { SvelteSet } from "svelte/reactivity";

    interface Props {
        open: boolean;
        name: string | null;
        handler: EventHandler;
    }

    let { open = $bindable(), name, handler }: Props = $props();
    let data = $derived(open && name ? ($inheritanceGraph[name] ?? null) : null);

    let rows = $derived(data?.walk(WalkDirection.DOWN, (node, level) => ({ node, level })) ?? []);

    let collapsed = $state(new SvelteSet<number>());
    $effect(() => {
        // reset collapsed nodes when data changes
        data;
        collapsed = new SvelteSet();
    });

    let visibleRows = $derived.by(() => {
        const result: Array<{ node: IGraphNode; level: number; index: number }> = [];

        const stack: number[] = []; // stack of parent indices that are visible
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // remove parents from stack that are at same or deeper level
            while (stack.length > 0 && rows[stack[stack.length - 1]].level >= row.level) {
                stack.pop();
            }

            // show if: root (no parents) OR parent is visible and not collapsed
            if (stack.length === 0 || !collapsed.has(stack[stack.length - 1])) {
                result.push({ ...row, index: i });
                stack.push(i);
            }
        }

        return result;
    });

    const toggleExpanded = (index: number) => {
        if (collapsed.has(index)) {
            collapsed.delete(index);
        } else {
            collapsed.add(index);
        }
    };
</script>

{#if data}
    <div class="flex h-full min-h-0 flex-1 flex-col">
        <VList data={visibleRows} class="h-full overflow-x-hidden p-2">
            {#snippet children({ node, level, index })}
                {@const hasChildren = node.subClasses.length > 0 || node.implementations.length > 0}

                {@const Chevron = collapsed.has(index) ? ChevronRight : ChevronDown}
                {@const { icon: Icon, classes: iconClasses } = node.entry
                    ? entryIcon(node.entry)
                    : node.type === IGraphNodeType.INTERFACE
                      ? { icon: Interface }
                      : { icon: Class }}

                <div
                    role="button"
                    tabindex="-1"
                    ondblclick={() => {
                        const entry = node.entry;
                        if (entry) {
                            open = false;
                            handler.open(entry);
                        }
                    }}
                    class={cn(
                        "hover:bg-accent/50 focus:bg-accent flex w-full cursor-pointer items-center gap-1 rounded-sm px-1 py-0.5 text-left text-sm transition-colors",
                        node.entry || "cursor-not-allowed"
                    )}
                    style="padding-left: {level * 16 + 4}px;"
                >
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) {
                                toggleExpanded(index);
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
