<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";

    interface Props {
        result: SearchResult;
        handler: EventHandler;
    }

    let { result, handler }: Props = $props();

    const handleOpen = () => handler.open(result.entry);
</script>

<div
    role="button"
    tabindex="-1"
    class="flex cursor-pointer justify-between px-4 py-1 text-xs hover:bg-muted"
    onclick={handleOpen}
    onkeydown={handleOpen}
>
    <span class="font-mono">{result.value}</span>
    <span class="pr-2 text-muted-foreground">{result.entry.shortName}</span>
</div>
