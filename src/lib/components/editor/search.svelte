<script lang="ts">
    import type { EditorView } from "@codemirror/view";
    import {
        closeSearchPanel,
        findNext,
        findPrevious,
        getSearchQuery,
        SearchQuery,
        setSearchQuery,
    } from "@codemirror/search";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { CaseSensitive, ChevronDown, ChevronUp, Regex, WholeWord, X } from "@lucide/svelte";
    import { Toggle } from "$lib/components/ui/toggle";
    import { t } from "$lib/i18n";
    import { cn } from "$lib/components/utils";

    interface Props {
        view: EditorView;
    }

    let { view }: Props = $props();

    const initialQuery = getSearchQuery(view.state);

    let search = $state(initialQuery.search);
    let caseSensitive = $state(initialQuery.caseSensitive);
    let regexp = $state(initialQuery.regexp);
    let wholeWord = $state(initialQuery.wholeWord);

    let currentMatch = $state(0);
    let totalMatches = $state(0);
    const updateMatchCounts = (queryChanged: boolean) => {
        const query = getSearchQuery(view.state);
        if (!query.search) {
            currentMatch = 0;
            totalMatches = 0;
            return;
        }

        if (!queryChanged && totalMatches >= 10000) {
            // query didn't change, and we're at the limit, don't recount
            return;
        }

        const cursor = query.getCursor(view.state.doc);
        const cursorPos = view.state.selection.main.head;
        let count = 0,
            current = 0;

        let result = cursor.next();
        while (!result.done) {
            count++;
            if (result.value.from <= cursorPos) {
                current = count;
            }

            if (count >= 10000) {
                // limit to 10,000 matches for performance
                break;
            }
            result = cursor.next();
        }

        totalMatches = count;
        currentMatch = current;
    };

    let timeoutId: any | null = null;
    $effect(() => {
        view.dispatch({
            effects: setSearchQuery.of(
                new SearchQuery({
                    search,
                    caseSensitive,
                    regexp,
                    wholeWord,
                })
            ),
        });

        // debounce match count updates
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            updateMatchCounts(true);
            timeoutId = null;
        }, 100);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) {
                findPrevious(view);
                updateMatchCounts(false);
            } else {
                findNext(view);
                updateMatchCounts(false);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            closeSearchPanel(view);
        }
    };

    // CodeMirror only focuses when it's already open, so we need to focus the input ourselves for the first time
    let inputElem: HTMLInputElement | null = $state(null);
    $effect(() => {
        if (inputElem) {
            inputElem.focus();
        }
    });
</script>

<div class="flex w-full items-center justify-between gap-1 p-2">
    <div class="flex grow items-center gap-1">
        <Input
            placeholder={$t("editor.search.placeholder")}
            type="text"
            bind:value={search}
            onkeydown={handleKeyDown}
            class="h-7 max-w-80 text-xs"
            main-field
            bind:ref={inputElem}
        />
        <Toggle
            bind:pressed={caseSensitive}
            size="sm"
            title={$t("editor.search.case-sensitive")}
            aria-label={$t("editor.search.case-sensitive")}
            class="h-7 w-7 p-0"
        >
            <CaseSensitive class="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
            bind:pressed={regexp}
            size="sm"
            title={$t("editor.search.regex")}
            aria-label={$t("editor.search.regex")}
            class="h-7 w-7 p-0"
        >
            <Regex class="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
            bind:pressed={wholeWord}
            size="sm"
            title={$t("editor.search.whole-word")}
            aria-label={$t("editor.search.whole-word")}
            class="h-7 w-7 p-0"
        >
            <WholeWord class="h-3.5 w-3.5" />
        </Toggle>
        <div class="bg-border h-5 w-px"></div>
        <span
            class={cn(
                "min-w-20 text-center text-xs whitespace-nowrap",
                search ? totalMatches === 0 && "text-destructive" : "text-muted-foreground"
            )}
        >
            {totalMatches > 0
                ? totalMatches >= 10000
                    ? "10,000+"
                    : $t("editor.search.matches", currentMatch, totalMatches)
                : $t("editor.search.no-matches")}
        </span>
        <Button
            variant="ghost"
            size="icon"
            onclick={() => {
                findPrevious(view);
                updateMatchCounts(false);
            }}
            class="h-7 w-7"
            title={$t("editor.search.previous")}
            aria-label={$t("editor.search.previous")}
        >
            <ChevronUp class="h-3.5 w-3.5" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onclick={() => {
                findNext(view);
                updateMatchCounts(false);
            }}
            class="h-7 w-7"
            title={$t("editor.search.next")}
            aria-label={$t("editor.search.next")}
        >
            <ChevronDown class="h-3.5 w-3.5" />
        </Button>
    </div>
    <Button
        variant="ghost"
        size="icon"
        onclick={() => closeSearchPanel(view)}
        class="h-7 w-7"
        title={$t("editor.search.close")}
        aria-label={$t("editor.search.close")}
    >
        <X class="h-3.5 w-3.5" />
    </Button>
</div>
