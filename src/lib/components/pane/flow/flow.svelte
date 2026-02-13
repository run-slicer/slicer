<script lang="ts">
    import { type ClassEntry, EntryType, memberEntry, type MemberEntry } from "$lib/workspace";
    import type { Member } from "@katana-project/asm";
    import { Circle, CircleX, GitPullRequestArrow, Workflow, Zap, ZapOff } from "@lucide/svelte";
    import { mode } from "mode-watcher";
    import {
        Background,
        BackgroundVariant,
        ControlButton,
        Controls,
        SvelteFlow,
        SvelteFlowProvider,
        type Edge,
        type Node,
    } from "@xyflow/svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import Loading from "$lib/components/loading.svelte";
    import ControlFlowNode from "./nodes/control_flow.svelte";
    import HierarchyNode from "./nodes/hierarchy.svelte";
    import CallNode from "./nodes/call.svelte";
    import FlowEdge from "./edge.svelte";
    import FlowMenu from "./menu.svelte";
    import { computeCallGraph, computeControlFlowGraph, computeHierarchyGraph, GraphType } from "./graph";
    import type { PaneProps } from "$lib/components/pane";
    import { cyrb53, prettyMethodDesc } from "$lib/utils";
    import { t } from "$lib/i18n";
    import { createCallGraph, inheritanceGraph, type InheritanceGraph } from "$lib/workspace/analysis/graph";
    import { cn } from "$lib/components/utils";
    import { Button } from "$lib/components/ui/button";

    let { tab, handler, classes }: PaneProps = $props();
    const entry = tab.entry!;

    const node = "node" in entry ? (entry as ClassEntry).node : null;
    const methods = node ? node.methods : [];

    let member = $state(entry.type === EntryType.MEMBER ? (entry as MemberEntry).member : null);
    let methodIndex = $state(
        (member
            ? methods.findIndex(
                  (m) => `${m.name.string}${m.type.string}` === `${member!.name.string}${member!.type.string}`
              )
            : -1
        ).toString()
    );
    $effect(() => {
        const parsedId = parseInt(methodIndex);
        member = parsedId > -1 ? methods[parsedId] : null;
    });

    let parentElem: HTMLElement | undefined = $state();

    let graphType = $derived(member ? GraphType.CONTROL_FLOW : GraphType.HIERARCHY);
    let showHandlerEdges = $state(false);
    let showSubtypes = $state(false);
    const computeGraph = async (
        type: GraphType,
        member: Member | null,
        inheritanceGraph: InheritanceGraph,
        showHandlerEdges: boolean,
        showSubtypes: boolean
    ): Promise<[Node[], Edge[]]> => {
        if (!node) {
            return [[], []]; // not a class
        }

        if (type === GraphType.HIERARCHY) {
            return computeHierarchyGraph(node, inheritanceGraph, showSubtypes, handler);
        }
        if (!member) {
            return [[], []]; // no member selected
        }

        const methodEntry =
            entry.type === EntryType.MEMBER ? (entry as MemberEntry) : memberEntry(entry as ClassEntry, member);
        const actualClasses = Array.from(classes.values()).filter((e) => e.type === EntryType.CLASS) as ClassEntry[];
        return type === GraphType.CALL
            ? computeCallGraph(await createCallGraph(methodEntry, actualClasses), handler)
            : computeControlFlowGraph(node, member, showHandlerEdges);
    };
</script>

<div class="relative h-full w-full" bind:this={parentElem}>
    <SvelteFlowProvider>
        <ContextMenu>
            <ContextMenuTrigger class="h-full w-full">
                {#await computeGraph(graphType, member, $inheritanceGraph, showHandlerEdges, showSubtypes)}
                    <Loading value={$t("pane.graph.loading")} timed />
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
                        nodeTypes={{ "cf-node": ControlFlowNode, "hier-node": HierarchyNode, "call-node": CallNode }}
                        edgeTypes={{ "auto-edge": FlowEdge }}
                    >
                        <Background variant={BackgroundVariant.Dots} />
                        <Controls showLock={false} position="bottom-right">
                            {#if graphType === GraphType.CONTROL_FLOW}
                                <ControlButton
                                    class="svelte-flow__controls-interactive"
                                    onclick={() => (showHandlerEdges = !showHandlerEdges)}
                                    title={$t("pane.graph.controls.exceptions")}
                                    aria-label={$t("pane.graph.controls.exceptions")}
                                >
                                    {@const Icon = showHandlerEdges ? Zap : ZapOff}
                                    <Icon size={12} class="fill-none!" />
                                </ControlButton>
                            {:else if graphType === GraphType.HIERARCHY}
                                <ControlButton
                                    class="svelte-flow__controls-interactive"
                                    onclick={() => (showSubtypes = !showSubtypes)}
                                    title={$t("pane.graph.controls.subtypes")}
                                    aria-label={$t("pane.graph.controls.subtypes")}
                                >
                                    {@const Icon = showSubtypes ? Circle : CircleX}
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
    <div class="absolute bottom-0 z-20 m-[15px] flex flex-row">
        {#if entry.type !== EntryType.MEMBER}
            <Select type="single" bind:value={methodIndex}>
                <SelectTrigger
                    class={cn(
                        "!bg-card h-7 max-w-[425px] text-xs whitespace-nowrap [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4",
                        graphType !== GraphType.HIERARCHY && "rounded-r-none border-r-0"
                    )}
                >
                    <div class="overflow-hidden text-ellipsis">
                        <span class="text-muted-foreground mr-2">
                            {$t("pane.graph.method")}
                        </span>
                        <span class="font-mono tracking-tight">
                            {!member
                                ? $t("pane.graph.method.none")
                                : `${member.name.string}${prettyMethodDesc(member.type.string, true)}`}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" side="top" align="start">
                    <SelectItem
                        value="-1"
                        label={$t("pane.graph.method.none")}
                        class="font-mono text-xs tracking-tight"
                    >
                        {$t("pane.graph.method.none")}
                    </SelectItem>
                    {#each methods as mth, i}
                        {@const label = `${mth.name.string}${prettyMethodDesc(mth.type.string, true)}`}
                        <SelectItem value={i.toString()} {label} class="font-mono text-xs tracking-tight break-all">
                            {label}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        {/if}
        {#if graphType !== GraphType.HIERARCHY}
            <Button
                variant="outline"
                size="icon"
                class={cn("!bg-card", entry.type !== EntryType.MEMBER && "rounded-l-none")}
                onclick={() => (graphType = graphType === GraphType.CALL ? GraphType.CONTROL_FLOW : GraphType.CALL)}
                title={$t(graphType === GraphType.CALL ? "pane.graph.calls.hide" : "pane.graph.calls.show")}
                aria-label={$t(graphType === GraphType.CALL ? "pane.graph.calls.hide" : "pane.graph.calls.show")}
            >
                {@const Icon = graphType === GraphType.CALL ? Workflow : GitPullRequestArrow}
                <Icon />
            </Button>
        {/if}
    </div>
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
