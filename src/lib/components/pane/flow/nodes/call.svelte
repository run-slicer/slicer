<script lang="ts">
    import { Handle, type NodeProps, Position } from "@xyflow/svelte";
    import type { CallGraphNodeData } from "../graph";
    import { cn } from "$lib/components/utils";

    interface Props extends NodeProps {
        data: CallGraphNodeData;
    }

    let { data }: Props = $props();
    let { owner, ownerDisplayName, name, type, open, openMember } = $derived(data.node);
</script>

<Handle type="target" position={Position.Top} />
<p class="flex font-mono whitespace-nowrap">
    <button title={owner} class={cn(open && "cursor-pointer underline decoration-1")} onclick={open}>
        {ownerDisplayName}
    </button>
    #
    <button title={`${name}${type}`} class={cn(open && "cursor-pointer underline decoration-1")} onclick={openMember}>
        {name}
    </button>
    {type}
</p>
<Handle type="source" position={Position.Bottom} />

<style>
    :global(.svelte-flow__node-call-node) {
        padding: 10px;
        border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));
        font-size: 12px;
        color: var(--xy-node-color, var(--xy-node-color-default));
        border: var(--xy-node-border, var(--xy-node-border-default));
        background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));
    }
</style>
