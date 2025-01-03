<script lang="ts">
    import { writable } from "svelte/store";
    import { type ClassEntry, EntryType, type MemberEntry } from "$lib/workspace";
    import type { Tab } from "$lib/tab";
    import type { Member } from "@run-slicer/asm";
    import { Lock, LockOpen, Zap, ZapOff } from "lucide-svelte";
    import { mode } from "mode-watcher";
    import { Background, ControlButton, Controls, SvelteFlow } from "@xyflow/svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import FlowNode from "./node.svelte";
    import { createComputedGraph } from "./graph";

    interface Props {
        tab: Tab;
    }

    let { tab }: Props = $props();
    const entry = tab.entry!;

    const node = "node" in entry ? (entry as ClassEntry).node : null;

    const pool = node ? node.pool : [];
    const methods = node ? node.methods : [];

    let member = $state(
        entry.type === EntryType.MEMBER ? (entry as MemberEntry).member : methods.length > 0 ? methods[0] : null
    );

    const createLabel = (method: Member | null): string => {
        return !method ? "<none>" : `${method.name.decode()}${method.type.decode()}`;
    };

    let method = $state((member ? methods.indexOf(member) : -1).toString());
    $effect(() => {
        const parsedId = parseInt(method);
        if (parsedId !== -1) {
            member = methods[parsedId];
        }
    });

    let draggable = $state(false);
    let showHandlerEdges = $state(false);

    let [nodes, edges] = $derived(createComputedGraph(member, pool, showHandlerEdges));
</script>

<div class="relative h-full w-full">
    {#key [member, showHandlerEdges]}
        <SvelteFlow
            nodes={writable(nodes)}
            edges={writable(edges)}
            fitView
            minZoom={0}
            colorMode={$mode || "system"}
            bind:nodesDraggable={draggable}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
            nodeTypes={{ block: FlowNode }}
        >
            <Background />
            <Controls showLock={false} position="bottom-right">
                <!-- override interactivity control: we only want it to toggle draggability -->
                <ControlButton
                    class="svelte-flow__controls-interactive"
                    on:click={() => (draggable = !draggable)}
                    title="toggle interactivity"
                    aria-label="toggle interactivity"
                >
                    {@const Icon = draggable ? LockOpen : Lock}
                    <Icon size={12} class="!fill-none" />
                </ControlButton>
                <ControlButton
                    class="svelte-flow__controls-interactive"
                    on:click={() => (showHandlerEdges = !showHandlerEdges)}
                    title="toggle exception handler edges"
                    aria-label="toggle exception handler edges"
                >
                    {@const Icon = showHandlerEdges ? Zap : ZapOff}
                    <Icon size={12} class="!fill-none" />
                </ControlButton>
            </Controls>
        </SvelteFlow>
    {/key}
    {#if entry.type !== EntryType.MEMBER}
        <div class="absolute bottom-0 m-[15px] max-w-[425px]">
            <Select type="single" bind:value={method}>
                <SelectTrigger class="h-7 whitespace-nowrap text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <div class="overflow-hidden text-ellipsis">
                        <span class="mr-2 text-muted-foreground">Method: </span>
                        <span class="font-mono tracking-tight">{createLabel(member)}</span>
                    </div>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll" align="start">
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
