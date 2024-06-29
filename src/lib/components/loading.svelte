<script lang="ts">
    import { onMount } from "svelte";
    import { Loader2 } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import { cn } from "$lib/utils";

    export let value: string | null = null;
    export let overlay = false;

    let duration = 0;
    if (overlay) {
        // only show fade animation for longer loads
        onMount(() => setTimeout(() => (duration = 300), 1000));
    }
</script>

<div
    out:fade={{ duration }}
    class={cn(
        "flex flex-col items-center",
        !overlay || "absolute left-[50%] top-16 z-[9999] translate-x-[-50%]",
        $$props.class
    )}
>
    <Loader2 class="h-16 w-16 animate-spin text-primary" />
    {#if value}
        <span class="mt-2 text-muted-foreground">{value}</span>
    {/if}
</div>
