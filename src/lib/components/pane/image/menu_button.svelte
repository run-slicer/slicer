<script lang="ts">
    import type { Icon } from "lucide-svelte";
    import type { ComponentType } from "svelte";

    export let icon: ComponentType<Icon>;
    export let label: string;
</script>

<button title={label} aria-label={label} on:click>
    <svelte:component this={icon} size={14} class="min-w-[14px] hover:text-muted-foreground" />
</button>
