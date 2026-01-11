<script lang="ts">
    import type { TooltipProps } from "$lib/components/editor/editor.svelte";
    import type { TypeReferenceResolver } from "@katana-project/laser";

    interface Props extends TooltipProps {
        resolver: TypeReferenceResolver | null;
    }

    let { pos, side, resolver }: Props = $props();

    let resolution = $derived(resolver?.resolveAt(pos, side));
</script>

{#if resolution}
    <div
        class="text-accent-foreground bg-accent animate-in fade-in-0 zoom-in-95 z-50 w-fit rounded-sm px-3 py-1.5 text-xs text-balance"
    >
        <div>{resolution.qualifiedName ?? resolution.name} ({resolution.kind})</div>
    </div>
{/if}
