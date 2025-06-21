<script lang="ts">
    import { Handle, type NodeProps, Position } from "@xyflow/svelte";
    import type { ControlFlowNodeData } from "../graph";

    interface Props extends NodeProps {
        data: ControlFlowNodeData;
    }

    let { data }: Props = $props();
</script>

<Handle type="target" position={Position.Top} />
{#each data.lines as line}
    <p class="font-mono tracking-tight whitespace-nowrap">{line}</p>
{/each}
<Handle type="source" position={Position.Bottom} />

<style>
    :global(.svelte-flow__node-cf-node) {
        padding: 10px;
        border-radius: var(--xy-node-border-radius, var(--xy-node-border-radius-default));
        font-size: 12px;
        color: var(--xy-node-color, var(--xy-node-color-default));
        border: var(--xy-node-border, var(--xy-node-border-default));
        background-color: var(--xy-node-background-color, var(--xy-node-background-color-default));
    }
</style>
