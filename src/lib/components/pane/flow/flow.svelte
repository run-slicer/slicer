<script lang="ts">
    import { type ClassEntry, EntryType, type MemberEntry } from "$lib/workspace";
    import type { Member } from "@run-slicer/asm";
    import { Zap, ZapOff } from "lucide-svelte";
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
    import FlowNode from "./node.svelte";
    import FlowEdge from "./edge.svelte";
    import FlowMenu from "./menu.svelte";
    import { createComputedGraph } from "./graph";
    import type { PaneProps } from "$lib/components/pane";

    let { tab }: PaneProps = $props();
    const entry = tab.entry!;

    const node = "node" in entry ? (entry as ClassEntry).node : null;

    const pool = node ? node.pool : [];
    const methods = node ? node.methods : [];

    let member = $state(
        entry.type === EntryType.MEMBER ? (entry as MemberEntry).member : methods.length > 0 ? methods[0] : null
    );

    const createLabel = (method: Member | null): string => {
        return !method ? "<none>" : `${method.name.string}${method.type.string}`;
    };

    let method = $state((member ? methods.indexOf(member) : -1).toString());
    $effect(() => {
        const parsedId = parseInt(method);
        if (parsedId !== -1) {
            member = methods[parsedId];
        }
    });

    let parentElem: HTMLElement | undefined = $state();

    let showHandlerEdges = $state(false);
</script>

<div class="relative h-full w-full" bind:this={parentElem}>
    <SvelteFlowProvider>
        <ContextMenu>
            <ContextMenuTrigger class="h-full w-full">
                {#await createComputedGraph(member, pool, showHandlerEdges)}
                    <Loading value="Computing graph..." />
                {:then [nodes, edges]}
                    <SvelteFlow
                        id={tab.id}
                        {nodes}
                        {edges}
                        fitView
                        minZoom={0}
                        colorMode={$mode || "system"}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        proOptions={{ hideAttribution: false /* ??? */ }}
                        nodeTypes={{ "elk-node": FlowNode }}
                        edgeTypes={{ "elk-edge": FlowEdge }}
                    >
                        <Background variant={BackgroundVariant.Dots} />
                        <Controls showLock={false} position="bottom-right">
                            <ControlButton
                                class="svelte-flow__controls-interactive"
                                onclick={() => (showHandlerEdges = !showHandlerEdges)}
                                title="toggle exception handler edges"
                                aria-label="toggle exception handler edges"
                            >
                                {@const Icon = showHandlerEdges ? Zap : ZapOff}
                                <Icon size={12} class="!fill-none" />
                            </ControlButton>
                        </Controls>
                    </SvelteFlow>
                {/await}
            </ContextMenuTrigger>
            <FlowMenu {parentElem} {node} {member} />
        </ContextMenu>
    </SvelteFlowProvider>
    {#if entry.type !== EntryType.MEMBER}
        <div class="absolute bottom-0 m-[15px] max-w-[425px]">
            <Select type="single" bind:value={method}>
                <SelectTrigger class="h-7 whitespace-nowrap text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <div class="overflow-hidden text-ellipsis">
                        <span class="mr-2 text-muted-foreground">Method: </span>
                        <span class="font-mono tracking-tight">{createLabel(member)}</span>
                    </div>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" side="top" align="start">
                    {#each methods as mth, i}
                        {@const label = createLabel(mth)}
                        <SelectItem value={i.toString()} {label} class="break-all font-mono text-xs tracking-tight">
                            {label}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    {/if}
</div>
