<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/components/utils";

    interface Props {
        inset?: boolean;
        center?: boolean;
        children?: Snippet;
    }

    let { inset, center, children }: Props = $props();
</script>

<div
    class={cn(
        "overflow-hidden text-ellipsis px-2 py-1.5 text-sm font-semibold text-foreground",
        center && "text-center",
        inset && "pl-8"
    )}
>
    {@render children?.()}
</div>
