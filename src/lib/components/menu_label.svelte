<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/components/utils";

    interface Props {
        inset?: boolean;
        children?: Snippet;
    }

    let { inset, children }: Props = $props();
</script>

<div class={cn("text-foreground overflow-hidden px-2 py-1.5 text-sm font-semibold text-ellipsis", inset && "pl-8")}>
    {@render children?.()}
</div>
