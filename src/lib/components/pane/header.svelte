<script lang="ts">
    import type { Icon } from "$lib/components/pane/tree/icons";

    export let name = "";
    export let icon: Icon | null = null;
</script>

<div class="h-8 w-full bg-muted/40">
    <div class="inline-flex h-full items-center bg-background px-3">
        {#if icon}
            <svelte:component this={icon} size={16} class="mr-1 text-muted-foreground" />
        {/if}
        <span class="text-sm">{name}</span>
    </div>
</div>
