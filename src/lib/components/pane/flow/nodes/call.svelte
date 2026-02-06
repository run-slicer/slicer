<script lang="ts">
    import { Handle, type NodeProps, Position } from "@xyflow/svelte";
    import type { CallGraphNodeData } from "../graph";

    interface Props extends NodeProps {
        data: CallGraphNodeData;
    }

    let { data }: Props = $props();
</script>

<Handle type="target" position={Position.Top} />
<p class="font-mono whitespace-nowrap">{data.node.id}</p>
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
