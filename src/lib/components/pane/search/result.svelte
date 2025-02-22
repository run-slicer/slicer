<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";
    import { memberEntry } from "$lib/workspace";

    interface Props {
        result: SearchResult;
        handler: EventHandler;
    }

    let { result, handler }: Props = $props();

    const handleOpen = () =>
        handler.open(
            result.member?.type?.string?.[0] === "(" /* method */
                ? memberEntry(result.entry, result.member)
                : result.entry
        );
</script>

<div
    role="button"
    tabindex="-1"
    class="flex cursor-pointer justify-between px-4 py-1 text-xs hover:bg-muted"
    onclick={handleOpen}
    onkeydown={handleOpen}
>
    <span class="break-anywhere font-mono">{result.value}</span>
    <span class="pl-2 text-muted-foreground">{result.entry.shortName}</span>
</div>
