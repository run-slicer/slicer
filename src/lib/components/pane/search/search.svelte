<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import type { PaneProps } from "$lib/components/pane";
    import { QueryType, search, type SearchResult } from "$lib/workspace/analysis";
    import ResultLine from "./result.svelte";
    import Dropdown from "./dropdown.svelte";
    import { VList } from "virtua/svelte";

    let { entries, handler }: PaneProps = $props();

    let value = $state("");
    let type = $state(QueryType.MEMBER);
    let results: SearchResult[] = $state([]);

    const handleSearch = async (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            results.length = 0;
            await search(entries, { type, value, flags: 0 }, (r) => results.push(r));
        }
    };
</script>

<div class="flex h-full w-full flex-col">
    <div class="flex w-full flex-row p-2">
        <Dropdown bind:value={type} />
        <Input
            placeholder="Search anything..."
            type="text"
            bind:value
            class="rounded-l-none"
            onkeydown={handleSearch}
        />
    </div>
    <VList data={results} class="flex h-full w-full flex-col" getKey={(_, i) => i}>
        {#snippet children(result)}
            <ResultLine {result} {handler} />
        {/snippet}
    </VList>
</div>
