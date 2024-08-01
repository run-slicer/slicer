<script lang="ts">
    import { writable } from "svelte/store";
    import { Background, Controls, SvelteFlow, ControlButton } from "@xyflow/svelte";
    import { type ClassEntry, type Entry, EntryType } from "$lib/workspace";
    import { TabType, update as updateTab } from "$lib/tab";
    import type { Member } from "@run-slicer/asm";
    import { GitPullRequest, Lock, LockOpen } from "lucide-svelte";
    import { mode } from "mode-watcher";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import type { Selected } from "bits-ui";
    import FlowNode from "./node.svelte";
    import { createComputedGraph } from "./";

    export let entry: Entry;
    const methods = entry.type === EntryType.CLASS ? (entry as ClassEntry).node.methods : [];

    export let member: Member | null;
    if (!member) {
        member = methods.length > 0 ? methods[0] : null;
    }

    const createLabel = (method: Member | null): string => {
        return !method ? "<none>" : `${method.name.decode()}${method.type.decode()}`;
    };

    let method: Selected<number> = { value: member ? methods.indexOf(member) : -1, label: createLabel(member) };
    $: member = method.value !== -1 ? methods[method.value] : null;

    $: [nodes, edges] = createComputedGraph(member);

    $: updateTab({
        id: `${TabType.FLOW_GRAPH}:${entry.data.name}`,
        type: TabType.FLOW_GRAPH,
        name: entry.data.shortName,
        icon: { icon: GitPullRequest, classes: ["text-muted-foreground"] },
        entry: entry,
        member: member ?? undefined,
    });

    let draggable = false;
</script>

{#key method}
    <SvelteFlow
        nodes={writable(nodes)}
        edges={writable(edges)}
        fitView
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
                <svelte:component this={draggable ? LockOpen : Lock} size={12} class="!fill-none" />
            </ControlButton>
        </Controls>
    </SvelteFlow>
{/key}
<div class="absolute bottom-0 m-[15px] max-w-[425px]">
    <Select bind:selected={method}>
        <SelectTrigger class="h-7 whitespace-nowrap text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4">
            <div class="overflow-hidden text-ellipsis">
                <span class="mr-2 text-muted-foreground">Method: </span>
                {method.label}
            </div>
        </SelectTrigger>
        <SelectContent class="max-h-[240px] w-full overflow-scroll">
            {#each methods as mth, i}
                {@const label = createLabel(mth)}
                <SelectItem value={i} {label} class="break-all text-xs">
                    {label}
                </SelectItem>
            {/each}
        </SelectContent>
    </Select>
</div>
