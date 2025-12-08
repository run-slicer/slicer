<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import type { PaneProps } from "$lib/components/pane";
    import { QueryType, search, SearchMode, type SearchResult } from "$lib/workspace/analysis";
    import ResultGroup from "./results.svelte";
    import Dropdown from "./dropdown.svelte";
    import { VList } from "virtua/svelte";
    import { Button } from "$lib/components/ui/button";
    import { SearchCode, X } from "@lucide/svelte";
    import { untrack } from "svelte";
    import { groupBy } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { error } from "$lib/log";
    import { t } from "$lib/i18n";
    import { cn } from "$lib/components/utils";

    let { entries, handler }: PaneProps = $props();

    let value = $state("");

    let searching = $state(false);
    let time = $state(-1);
    let cancelSearch: (() => void) | null = $state(null);

    let type = $state(QueryType.STRING);
    let mode = $state(SearchMode.PARTIAL_MATCH);
    let ref = $state(false);

    let results: SearchResult[] = $state.raw([]);
    $effect(() => {
        const entryNames = new Set(entries.map((e) => e.name));

        // discard removed entries
        results = untrack(() => results).filter((r) => entryNames.has(r.entry.name));
    });

    let resultsByEntry = $derived(Array.from(groupBy(results, (r) => r.entry.name).entries()));

    const handleSearch = async (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            results = [];
            searching = true;
            time = 0;

            const start = Date.now();
            const intervalId = setInterval(() => {
                time = Date.now() - start;
            }, 20);

            try {
                const task = search(entries, { type, value, mode, ref }, (r) => {
                    results = [...results, r];
                });

                cancelSearch = () => {
                    task.cancel();
                    cancelSearch = null;
                };
                await task.promise;
            } catch (e) {
                error("failed to search", e);
                toast.error($t("toast.error.title.generic"), {
                    description: $t("toast.error.search"),
                });
            }

            clearInterval(intervalId);
            searching = false;
        }
    };
    const handleClear = () => {
        if (searching) {
            cancelSearch?.();
        } else {
            results = [];
            value = "";
            time = -1;
            searching = false;
        }
    };
</script>

<div class="flex h-full w-full flex-col">
    <div class="flex w-full flex-row px-2 pt-2">
        <Dropdown bind:type bind:mode bind:ref disabled={searching} />
        <Input
            placeholder={$t("pane.search.placeholder")}
            type="text"
            bind:value
            class="z-10 rounded-l-none rounded-r-none border-r-0"
            onkeydown={handleSearch}
            disabled={searching}
        />
        <Button
            variant="outline"
            size="icon"
            class={cn("min-w-10 rounded-l-none border-l-0", searching && "opacity-50")}
            onclick={handleClear}
        >
            <X />
        </Button>
    </div>
    <div class="border-b-border flex w-full flex-row justify-between border-b px-3 py-2 text-xs">
        {#if searching}
            <span>{$t("pane.search.loading")}</span>
            <span class="text-muted-foreground">
                {$t("pane.search.results", results.length, time)}
            </span>
        {:else if !searching && time > -1}
            <span>{$t("pane.search.loaded")}</span>
            <span class="text-muted-foreground">
                {$t("pane.search.results", results.length, time)}
            </span>
        {:else}
            <span class="text-muted-foreground">{$t("pane.search.no-results")}</span>
        {/if}
    </div>
    {#if !searching && time < 0}
        <div class="flex h-full w-full flex-col items-center justify-center gap-4">
            <div class="bg-muted/30 flex h-16 w-16 animate-bounce items-center justify-center rounded-full">
                <SearchCode class="text-muted-foreground h-8 w-8" />
            </div>
            <p class="bg-border h-px w-1/3"></p>
            <p class="text-muted-foreground text-center text-xs">{@html $t("pane.search.welcome")}</p>
        </div>
    {:else}
        <VList data={resultsByEntry} class="flex h-full w-full flex-col" getKey={(_, i) => i}>
            {#snippet children([entryName, entryResults])}
                <ResultGroup name={entryName} results={entryResults} {handler} />
            {/snippet}
        </VList>
    {/if}
</div>
