<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { Coffee } from "@lucide/svelte";
    import Result from "./result.svelte";
    import ResultMenu from "./menu.svelte";

    interface Props {
        name: string;
        results: SearchResult[];
        handler: EventHandler;
    }

    let { name, results, handler }: Props = $props();
    let entry = $derived(results[0].entry);
</script>

<ContextMenu>
    <ContextMenuTrigger>
        <div
            role="button"
            tabindex="-1"
            class="hover:bg-muted flex cursor-pointer px-2 py-1 text-xs"
            onclick={() => handler.open(entry)}
            onkeydown={() => handler.open(entry)}
        >
            <Coffee size={16} class="min-w-[16px] text-red-500" />
            <span class="text-muted-foreground overflow-x-hidden pl-2 text-ellipsis" title={name}>{name}</span>
        </div>
    </ContextMenuTrigger>
    <ResultMenu {entry} {handler} />
</ContextMenu>

{#each results as result}
    <Result {result} {handler} />
{/each}
