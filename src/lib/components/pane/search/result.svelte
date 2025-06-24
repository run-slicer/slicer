<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";
    import { memberEntry } from "$lib/workspace";
    import { TabType } from "$lib/tab";
    import { cn } from "$lib/components/utils";

    interface Props {
        result: SearchResult;
        handler: EventHandler;
    }

    let { result, handler }: Props = $props();
    let isMember = $derived(result.member?.type?.string?.charAt(0) === "(");

    const handleOpen = async () => {
        if (isMember) {
            await handler.open(memberEntry(result.entry, result.member!), TabType.CODE);
        }
    };
</script>

<div
    role="button"
    tabindex="-1"
    class={cn(
        "hover:bg-muted flex justify-between py-1 pr-4 pl-8 text-xs",
        isMember ? "cursor-pointer" : "cursor-not-allowed"
    )}
    onclick={handleOpen}
    onkeydown={handleOpen}
>
    <span class="break-anywhere font-mono">{result.value}</span>
</div>
