<script lang="ts">
    import type { PaneProps } from "$lib/components/pane";
    import { ChevronsRight } from "lucide-svelte";
    import { type Result, evalContext } from "./repl";
    import ResultLine from "./result.svelte";
    import { onMount } from "svelte";

    let _: PaneProps = $props();

    // configure automatic scrolling
    let resultsElem: HTMLElement | undefined = $state();
    const scrollObserver = new MutationObserver((mutations) => {
        if (mutations.some((m) => m.type === "childList")) {
            resultsElem!.scrollTop = resultsElem!.scrollHeight;
        }
    });
    onMount(() => {
        scrollObserver.observe(resultsElem!, { childList: true });
    });

    const evaluate = evalContext();

    let value = $state("");
    let results: Result[] = $state([]);
    const handleEnter = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();

            results.push(evaluate(value));
            resultsElem!.scrollTo({ top: resultsElem!.scrollHeight });

            value = ""; // reset input
        }
    };

    const handleResize = (e: Event) => {
        const target = e.currentTarget as HTMLTextAreaElement;
        target.style.height = "auto";
        target.style.height = `${target.scrollHeight}px`;
    };
</script>

<div class="flex h-full w-full flex-col">
    <div class="flex h-full w-full flex-col overflow-y-auto" bind:this={resultsElem}>
        {#each results as result, i (i)}
            <ResultLine {result} />
        {/each}
    </div>
    <div class="flex w-full flex-row border-t border-t-input px-3 py-2">
        <ChevronsRight class="mr-2 size-4" />
        <textarea
            bind:value
            class="min-h-10 w-full resize-none overflow-hidden bg-background font-mono text-xs focus-visible:outline-none"
            onkeydown={handleEnter}
            oninput={handleResize}
        ></textarea>
    </div>
</div>
