<script lang="ts">
    import { BaseEdge, type EdgeProps } from "@xyflow/svelte";
    import type { ElkExtendedEdge } from "elkjs/lib/elk-api";
    import { getSmoothStepPathFromElk } from "./edge";

    let { id, interactionWidth, label, labelStyle, style, markerEnd, markerStart, data }: EdgeProps = $props();

    const elkEdge = data as unknown as ElkExtendedEdge;
    let [path, labelX, labelY] = $derived(getSmoothStepPathFromElk(elkEdge));
</script>

<BaseEdge {id} {path} {labelX} {labelY} {label} {labelStyle} {markerStart} {markerEnd} {interactionWidth} {style} />
