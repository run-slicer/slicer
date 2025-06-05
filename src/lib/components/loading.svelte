<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { cn } from "./utils";

    interface Props {
        value?: string | null;
        center?: boolean;
        timed?: boolean;
        class?: string;
    }

    let { value = null, center = false, timed = false, class: clazz }: Props = $props();

    let time = $state(0);
    let intervalId: any;

    let duration = $state(100); // shortened fade animation for shorter loads
    onMount(() => {
        setTimeout(() => (duration = 300), 300);

        const start = Date.now();
        intervalId = setInterval(() => {
            time = Date.now() - start;
        }, 20);
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });
</script>

<div
    out:fade={{ duration }}
    class="bg-background/80 absolute top-0 left-0 z-10 h-full w-full backdrop-blur-xs will-change-[opacity]"
>
    <div class={cn("flex w-full flex-col items-center", center ? "h-full justify-center" : "mt-16", clazz)}>
        <div class="border-muted border-t-primary h-16 w-16 animate-spin rounded-full border-4 border-t-4"></div>
        {#if value}
            <span class="text-muted-foreground mt-2">{value}</span>
        {/if}
        {#if timed}
            <span class="text-muted-foreground mt-1 text-xs">{time}ms</span>
        {/if}
    </div>
</div>
