<script lang="ts">
    import { X } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import type { Icon } from "$lib/components/icons";
    import { cn } from "$lib/utils";

    export let name = "";
    export let icon: Icon | null = null;

    export let active = true;
    export let closeable = false;

    const dispatch = createEventDispatcher();
    const handleClose = (e: MouseEvent) => {
        e.stopPropagation();
        dispatch("close");
    };
</script>

<button class={cn("inline-flex h-full items-center bg-background px-3 cursor-default", active || "bg-background/40")} on:click>
    {#if icon}
        <svelte:component this={icon} size={16} class="mr-1.5 text-muted-foreground" />
    {/if}
    <span class="text-sm">{name}</span>
    {#if closeable}
        <button class="ml-3" on:click={handleClose}>
            <X size={14} class="text-muted-foreground/40 hover:text-muted-foreground/60" />
        </button>
    {/if}
</button>
