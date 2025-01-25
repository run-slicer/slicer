<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { cn } from "./utils";

    interface Props {
        value?: string | null;
        center?: boolean;
        class?: string;
    }

    let { value = null, center = false, class: clazz }: Props = $props();

    let duration = $state(100); // shortened fade animation for shorter loads
    onMount(() => setTimeout(() => (duration = 300), 300));
</script>

<div
    out:fade={{ duration }}
    class="absolute left-0 top-0 z-10 h-full w-full bg-background/80 backdrop-blur-sm will-change-[opacity]"
>
    <div class={cn("flex w-full flex-col items-center", center ? "h-full justify-center" : "mt-16", clazz)}>
        <div class="h-16 w-16 animate-spin rounded-full border-4 border-t-4 border-muted border-t-primary"></div>
        {#if value}
            <span class="mt-2 text-muted-foreground">{value}</span>
        {/if}
    </div>
</div>
