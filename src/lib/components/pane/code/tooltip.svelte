<script lang="ts">
    import type { TooltipProps } from "$lib/components/editor/editor.svelte";
    import { syntaxTree } from "@codemirror/language";
    import { Tree } from "@lezer/common";

    let { view, pos, side }: TooltipProps = $props();

    let tree = $derived(syntaxTree(view.state));
    let node = $derived(tree.resolveInner(pos, side));
</script>

{#if tree !== Tree.empty}
    <div class="text-accent-foreground bg-accent animate-in fade-in-0 zoom-in-95 z-50 w-fit rounded-sm px-3 py-1.5 text-xs text-balance">
        <div>{node.name}</div>
    </div>
{/if}
