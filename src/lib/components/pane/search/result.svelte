<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";
    import { memberEntry } from "$lib/workspace";
    import { cn } from "$lib/components/utils";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import ResultMenu from "./menu.svelte";

    interface Props {
        result: SearchResult;
        handler: EventHandler;
    }

    let { result, handler }: Props = $props();
    let entry = $derived(
        result.member?.type?.string?.charAt(0) === "(" ? memberEntry(result.entry, result.member!) : null
    );

    const handleOpen = async () => {
        if (entry) {
            await handler.open(entry);
        }
    };
</script>

<ContextMenu>
    <ContextMenuTrigger>
        <div
            role="button"
            tabindex="-1"
            class={cn(
                "hover:bg-muted flex justify-between py-1 pr-4 pl-8 text-xs",
                entry ? "cursor-pointer" : "cursor-not-allowed"
            )}
            onclick={handleOpen}
            onkeydown={handleOpen}
        >
            <span class="break-anywhere font-mono">{result.value}</span>
        </div>
    </ContextMenuTrigger>
    {#if entry}
        <ResultMenu {entry} {handler} />
    {/if}
</ContextMenu>
