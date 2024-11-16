<script lang="ts">
    import { Position, Handle, type NodeProps } from "@xyflow/svelte";
    import type { NodeData } from "./graph";

    interface Props extends NodeProps {
        data: NodeData;
    }

    let { data }: Props = $props();
</script>

<Handle type="target" position={Position.Top} />
{#each data.lines as line}
    <p class="whitespace-nowrap font-mono tracking-tight">{line}</p>
{/each}
<Handle type="source" position={Position.Bottom} />
