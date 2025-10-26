<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/components/utils";

    interface Props {
        id: string;
        label: string;
        small?: boolean;
        children?: Snippet;
    }

    let { id, label, small, children }: Props = $props();
</script>

<div class="space-y-3" data-section={id}>
    <h2 class={cn("border-b pb-2 font-semibold", small || "text-lg")}>{label}</h2>
    <div class="grid gap-2">
        {@render children?.()}
    </div>
</div>
