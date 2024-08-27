<svelte:options immutable />

<script lang="ts">
    import { writable } from "svelte/store";
    import { type ClassEntry, EntryType } from "$lib/workspace";
    import type { Tab } from "$lib/tab";
    import type { Member } from "@run-slicer/asm";
    import { Lock, LockOpen, Zap, ZapOff } from "lucide-svelte";
    import { mode } from "mode-watcher";
    import Loading from "$lib/components/loading.svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import type { Selected } from "bits-ui";

    export let tab: Tab;
    const entry = tab.entry!;

    const node = entry.type === EntryType.CLASS ? (entry as ClassEntry).node : null;

    const pool = node ? node.pool : [];
    const methods = node ? node.methods : [];

    let member = methods.length > 0 ? methods[0] : null;

    const createLabel = (method: Member | null): string => {
        return !method ? "<none>" : `${method.name.decode()}${method.type.decode()}`;
    };

    let method: Selected<number> = { value: member ? methods.indexOf(member) : -1, label: createLabel(member) };
    $: member = method.value !== -1 ? methods[method.value] : null;

    let draggable = false;
    let showHandlerEdges = false;
</script>

<div class="relative h-full w-full">
    {#await Promise.all([import("@xyflow/svelte"), import("./node.svelte"), import("./")])}
        <Loading value="Loading..." overlay />
    {:then [{ Background, Controls, SvelteFlow, ControlButton }, FlowNode, { createComputedGraph }]}
        {@const [nodes, edges] = createComputedGraph(member, pool, showHandlerEdges)}
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
                nodeTypes={{ block: FlowNode.default }}
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
                        <svelte:component this={draggable ? LockOpen : Lock} size={12} class="!fill-none" />
                    </ControlButton>
                    <ControlButton
                        class="svelte-flow__controls-interactive"
                        on:click={() => (showHandlerEdges = !showHandlerEdges)}
                        title="toggle exception handler edges"
                        aria-label="toggle exception handler edges"
                    >
                        <svelte:component this={showHandlerEdges ? Zap : ZapOff} size={12} class="!fill-none" />
                    </ControlButton>
                </Controls>
            </SvelteFlow>
        {/key}
        <div class="absolute bottom-0 m-[15px] max-w-[425px]">
            <Select bind:selected={method}>
                <SelectTrigger class="h-7 whitespace-nowrap text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
                    <div class="overflow-hidden text-ellipsis">
                        <span class="mr-2 text-muted-foreground">Method: </span>
                        <span class="font-mono tracking-tight">{method.label}</span>
                    </div>
                </SelectTrigger>
                <SelectContent class="max-h-[240px] w-full overflow-scroll">
                    {#each methods as mth, i}
                        {@const label = createLabel(mth)}
                        <SelectItem value={i} {label} class="break-all font-mono text-xs tracking-tight">
                            {label}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    {/await}
</div>
