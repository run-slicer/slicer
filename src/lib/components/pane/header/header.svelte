<script lang="ts">
    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();
</script>

<div class="z-10 flex h-8 min-h-8 w-full gap-0.5 overflow-x-auto bg-muted/60 scrollbar-none">
    {@render children?.()}
</div>
