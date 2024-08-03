<script lang="ts">
    import { Position, Handle, type NodeProps } from "@xyflow/svelte";
    import type { NodeData } from "./";

    interface $$Props extends NodeProps {}

    export let data: $$Props["data"];
    const typedData = data as NodeData;

    $$restProps; // ignore warning
</script>

<Handle type="target" position={Position.Top} />
{#each typedData.lines as line}
    <p class="whitespace-nowrap font-mono tracking-tight">{line}</p>
{/each}
<Handle type="source" position={Position.Bottom} />
