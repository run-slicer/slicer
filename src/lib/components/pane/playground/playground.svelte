<script lang="ts">
    import type { PaneProps } from "$lib/components/pane";
    import { ChevronsRight } from "@lucide/svelte";
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
    let currentResult = $state(-1);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();

            results.push(evaluate(value));
            resultsElem!.scrollTo({ top: resultsElem!.scrollHeight });

            value = "";
            currentResult = -1;
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const delta = e.key === "ArrowUp" ? -1 : 1;

            const newResult = (currentResult === -1 ? results.length : currentResult) + delta;
            if (newResult === results.length) {
                value = "";
                currentResult = -1;
            } else if (newResult >= 0 && newResult < results.length) {
                e.preventDefault();
                value = results[newResult].expr;
                currentResult = newResult;
            }
        }
    };

    const handleInput = (e: Event) => {
        const target = e.currentTarget as HTMLTextAreaElement;
        target.style.height = "auto";
        target.style.height = `${target.scrollHeight}px`;

        currentResult = -1;
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
            class="min-h-10 w-full resize-none overflow-hidden bg-background font-mono text-xs focus-visible:outline-hidden"
            spellcheck="false"
            onkeydown={handleKeyDown}
            oninput={handleInput}
        ></textarea>
    </div>
</div>
