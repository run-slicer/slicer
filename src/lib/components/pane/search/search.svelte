<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import type { PaneProps } from "$lib/components/pane";
    import { QueryType, search, SearchMode, type SearchResult } from "$lib/workspace/analysis";
    import ResultLine from "./result.svelte";
    import Dropdown from "./dropdown.svelte";
    import { VList } from "virtua/svelte";
    import { Button } from "$lib/components/ui/button";
    import { X } from "lucide-svelte";
    import { untrack } from "svelte";

    let { entries, handler }: PaneProps = $props();

    let value = $state("");

    let searching = $state(false);
    let time = $state(-1);

    let type = $state(QueryType.POOL_ENTRY);
    let mode = $state(SearchMode.PARTIAL_MATCH);

    let results: SearchResult[] = $state.raw([]);
    $effect(() => {
        const entryNames = new Set(entries.map((e) => e.name));

        // discard removed entries
        results = untrack(() => results).filter((r) => entryNames.has(r.entry.name));
    });

    const handleSearch = async (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            results = [];
            searching = true;

            const start = Date.now();
            const intervalId = setInterval(() => {
                time = Date.now() - start;
            }, 20);

            await search(entries, { type, value, mode }, (r) => {
                results = [...results, r];
            });

            clearInterval(intervalId);
            searching = false;
        }
    };
    const handleClear = () => {
        results = [];
        value = "";
        time = -1;
        searching = false;
    };
</script>

<div class="flex h-full w-full flex-col">
    <div class="flex w-full flex-row px-2 pt-2">
        <Dropdown bind:type bind:mode disabled={searching} />
        <Input
            placeholder="Search anything..."
            type="text"
            bind:value
            class="z-10 rounded-l-none rounded-r-none"
            onkeydown={handleSearch}
            disabled={searching}
        />
        <Button
            variant="outline"
            size="icon"
            class="min-w-10 rounded-l-none border-l-0"
            onclick={handleClear}
            disabled={searching}
        >
            <X />
        </Button>
    </div>
    <div class="flex w-full flex-row justify-between border-b border-b-border px-4 py-2 text-xs">
        {#if searching}
            <span>Searching...</span>
            <span class="text-muted-foreground">{results.length} result(s), elapsed {time}ms</span>
        {:else if !searching && time > -1}
            <span>Search finished.</span>
            <span class="text-muted-foreground">{results.length} result(s), elapsed {time}ms</span>
        {:else}
            <span class="text-muted-foreground">No results? Search something.</span>
        {/if}
    </div>
    <VList data={results} class="flex h-full w-full flex-col" getKey={(_, i) => i}>
        {#snippet children(result)}
            <ResultLine {result} {handler} />
        {/snippet}
    </VList>
</div>
