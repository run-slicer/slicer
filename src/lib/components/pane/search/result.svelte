<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";
    import { memberEntry } from "$lib/workspace";
    import { TabType } from "$lib/tab";

    interface Props {
        result: SearchResult;
        handler: EventHandler;
    }

    let { result, handler }: Props = $props();

    const handleOpen = async () => {
        const method = result.member?.type?.string?.charAt(0) === "(";

        await handler.open(
            method ? memberEntry(result.entry, result.member!) : result.entry,
            method ? TabType.CODE : TabType.CLASS
        );
    };
</script>

<div
    role="button"
    tabindex="-1"
    class="hover:bg-muted flex cursor-pointer justify-between px-4 py-1 text-xs"
    onclick={handleOpen}
    onkeydown={handleOpen}
>
    <span class="break-anywhere font-mono">{result.value}</span>
    <span class="text-muted-foreground pl-2" title={result.entry.name}>{result.entry.shortName}</span>
</div>
