<script lang="ts">
    import type { SearchResult } from "$lib/workspace/analysis";
    import type { EventHandler } from "$lib/event";
    import { TabType } from "$lib/tab";
    import { Coffee } from "@lucide/svelte";
    import Result from "./result.svelte";

    interface Props {
        name: string;
        results: SearchResult[];
        handler: EventHandler;
    }

    let { name, results, handler }: Props = $props();

    const handleOpen = async () => {
        await handler.open(results[0].entry, TabType.CLASS);
    };
</script>

<div
    role="button"
    tabindex="-1"
    class="hover:bg-muted flex cursor-pointer px-2 py-1 text-xs"
    onclick={handleOpen}
    onkeydown={handleOpen}
>
    <Coffee size={16} class="min-w-[16px] text-red-500" />
    <span class="text-muted-foreground overflow-x-hidden pl-2 text-ellipsis" title={name}>{name}</span>
</div>

{#each results as result}
    <Result {result} {handler} />
{/each}
