<script lang="ts">
    import { Handle, type NodeProps, Position } from "@xyflow/svelte";
    import type { NodeData } from "./graph";

    interface Props extends NodeProps {
        data: NodeData;
    }

    let { data }: Props = $props();
</script>

<Handle type="target" position={Position.Top} />
{#each data.lines as line}
    <p class="font-mono tracking-tight whitespace-nowrap">{line}</p>
{/each}
<Handle type="source" position={Position.Bottom} />
