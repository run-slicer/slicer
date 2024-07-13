<script lang="ts">
    import type { Icon } from "$lib/components/icons";
    import { X } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";

    export let name = "";
    export let icon: Icon | null = null;

    export let closeable = false;

    const dispatch = createEventDispatcher();
</script>

<div class="inline-flex h-full items-center bg-background px-3">
    {#if icon}
        <svelte:component this={icon} size={16} class="mr-1.5 text-muted-foreground" />
    {/if}
    <span class="text-sm">{name}</span>
    {#if closeable}
        <button class="ml-3" on:click={() => dispatch("close")}>
            <X size={14} class="text-muted-foreground/40 hover:text-muted-foreground/60" />
        </button>
    {/if}
</div>
