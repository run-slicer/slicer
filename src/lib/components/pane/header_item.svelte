<script lang="ts">
    import { X } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import type { StyledIcon } from "$lib/components/icons";
    import { cn } from "$lib/utils";

    export let name = "";
    export let icon: StyledIcon | null = null;

    export let active = true;
    export let closeable = false;

    const dispatch = createEventDispatcher();
    const handleClose = (e: MouseEvent) => {
        e.stopPropagation();
        dispatch("close");
    };
</script>

<button
    class={cn("inline-flex h-full cursor-default items-center bg-background px-3", active || "bg-background/40")}
    on:click
>
    {#if icon}
        <svelte:component this={icon.icon} size={16} class={cn("mr-1.5 min-w-[16px]", icon.classes)} />
    {/if}
    <span class="whitespace-nowrap break-keep text-sm">{name}</span>
    {#if closeable}
        <button class="ml-3" on:click={handleClose}>
            <X size={14} class="min-w-[14px] text-muted-foreground/40 hover:text-muted-foreground/60" />
        </button>
    {/if}
</button>
