<script lang="ts">
    import { Handle, type NodeProps, Position } from "@xyflow/svelte";
    import type { HierarchyNodeData } from "../graph";
    import { Separator } from "$lib/components/ui/separator";

    interface Props extends NodeProps {
        data: HierarchyNodeData;
    }

    let { data }: Props = $props();
    let { fields, methods } = $derived(data.node);
</script>

<Handle type="target" position={Position.Top} />
<p class="px-[10px] font-mono tracking-tight whitespace-nowrap">{data.node.name}</p>
<div class="font-mono text-[10px]">
    {#if fields.length > 0}
        <Separator class="my-[10px]" />
        <div class="px-[10px]">
            {#each fields as field}
                <p><span class="text-muted-foreground">{field.type}</span> {field.descriptor}</p>
            {/each}
        </div>
    {/if}
    {#if methods.length > 0}
        <Separator class="my-[10px]" />
        <div class="px-[10px]">
            {#each methods as method}
                <p><span class="text-muted-foreground">{method.type}</span> {method.descriptor}</p>
            {/each}
        </div>
    {/if}
</div>
<Handle type="source" position={Position.Bottom} />

<style>
    :global(.svelte-flow__node-hier-node) {
        padding: 10px 0;
        border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));
        font-size: 12px;
        color: var(--xy-node-color, var(--xy-node-color-default));
        border: var(--xy-node-border, var(--xy-node-border-default));
        background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));
    }
</style>
