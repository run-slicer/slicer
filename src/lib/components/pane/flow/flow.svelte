<script lang="ts">
    import { type ClassEntry, EntryType, type MemberEntry } from "$lib/workspace";
    import type { Member } from "@run-slicer/asm";
    import { Circle, CircleX, Zap, ZapOff } from "@lucide/svelte";
    import { mode } from "mode-watcher";
    import {
        Background,
        BackgroundVariant,
        ControlButton,
        Controls,
        SvelteFlow,
        SvelteFlowProvider,
    } from "@xyflow/svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import Loading from "$lib/components/loading.svelte";
    import ControlFlowNode from "./nodes/control_flow.svelte";
    import HierarchyNode from "./nodes/hierarchy.svelte";
    import FlowEdge from "./edge.svelte";
    import FlowMenu from "./menu.svelte";
    import { computeControlFlowGraph, computeHierarchyGraph } from "./graph";
    import type { Edge, Node } from "@xyflow/svelte";
    import type { PaneProps } from "$lib/components/pane";
    import { cyrb53 } from "$lib/utils";

    let { tab, classes }: PaneProps = $props();
    const entry = tab.entry!;

    const node = "node" in entry ? (entry as ClassEntry).node : null;

    const pool = node ? node.pool : [];
    const methods = node ? node.methods : [];

    let member = $state(entry.type === EntryType.MEMBER ? (entry as MemberEntry).member : null);
    const createLabel = (method: Member | null): string => {
        return !method ? "<none>" : `${method.name.string}${method.type.string}`;
    };

    let methodIndex = $state((member ? methods.indexOf(member) : -1).toString());
    $effect(() => {
        const parsedId = parseInt(methodIndex);
        member = parsedId > -1 ? methods[parsedId] : null;
    });

    let parentElem: HTMLElement | undefined = $state();

    let showHandlerEdges = $state(false);
    let showImplicitSuperTypes = $state(false);
    const computeGraph = async (
        member: Member | null,
        showHandlerEdges: boolean,
        showImplicitSuperTypes: boolean
    ): Promise<[Node[], Edge[]]> => {
        if (!node) {
            return [[], []]; // not a class
        }

        return member
            ? computeControlFlowGraph(member, pool, showHandlerEdges)
            : computeHierarchyGraph(node, classes, showImplicitSuperTypes);
    };
</script>

<div class="relative h-full w-full" bind:this={parentElem}>
    <SvelteFlowProvider>
        <ContextMenu>
            <ContextMenuTrigger class="h-full w-full">
                {#await computeGraph(member, showHandlerEdges, showImplicitSuperTypes)}
                    <Loading value="Computing graph..." timed />
                {:then [nodes, edges]}
                    <SvelteFlow
                        id={cyrb53(tab.id).toString(16)}
                        {nodes}
                        {edges}
                        fitView
                        minZoom={0}
                        colorMode={mode.current || "system"}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        proOptions={{ hideAttribution: true }}
                        nodeTypes={{ "cf-node": ControlFlowNode, "hier-node": HierarchyNode }}
                        edgeTypes={{ "auto-edge": FlowEdge }}
                    >
                        <Background variant={BackgroundVariant.Dots} />
                        <Controls showLock={false} position="bottom-right">
                            {#if member}
                                <ControlButton
                                    class="svelte-flow__controls-interactive"
                                    onclick={() => (showHandlerEdges = !showHandlerEdges)}
                                    title="toggle exception handler edges"
                                    aria-label="toggle exception handler edges"
                                >
                                    {@const Icon = showHandlerEdges ? Zap : ZapOff}
                                    <Icon size={12} class="fill-none!" />
                                </ControlButton>
                            {:else}
                                <ControlButton
                                    class="svelte-flow__controls-interactive"
                                    onclick={() => (showImplicitSuperTypes = !showImplicitSuperTypes)}
                                    title="toggle implicit super types"
                                    aria-label="toggle implicit super types"
                                >
                                    {@const Icon = showImplicitSuperTypes ? Circle : CircleX}
                                    <Icon size={12} class="fill-none!" />
                                </ControlButton>
                            {/if}
                        </Controls>
                    </SvelteFlow>
                {/await}
            </ContextMenuTrigger>
            <FlowMenu {parentElem} {node} {member} />
        </ContextMenu>
    </SvelteFlowProvider>
    {#if entry.type !== EntryType.MEMBER}
        <div class="absolute bottom-0 m-[15px]">
            <Select type="single" bind:value={methodIndex}>
                <SelectTrigger class="h-7 max-w-[425px] text-xs whitespace-nowrap [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <div class="overflow-hidden text-ellipsis">
                        <span class="text-muted-foreground mr-2">Method: </span>
                        <span class="font-mono tracking-tight">{createLabel(member)}</span>
                    </div>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" side="top" align="start">
                    <SelectItem value="-1" label="<none>" class="font-mono text-xs tracking-tight">
                        {"<none>"}
                    </SelectItem>
                    {#each methods as mth, i}
                        {@const label = createLabel(mth)}
                        <SelectItem value={i.toString()} {label} class="font-mono text-xs tracking-tight break-all">
                            {label}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    {/if}
</div>

<style>
    :global(.svelte-flow__handle) {
        background-color: transparent;
        border: none;
    }
    :global(.svelte-flow__edge-label) {
        border-radius: 5px;
    }
    :global(.svelte-flow__controls > :first-child) {
        border-top-left-radius: calc(var(--radius) / 2);
        border-top-right-radius: calc(var(--radius) / 2);
    }
    :global(.svelte-flow__controls > :last-child) {
        border-bottom-left-radius: calc(var(--radius) / 2);
        border-bottom-right-radius: calc(var(--radius) / 2);
    }
</style>
