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

    interface Props {
        view: EditorView;
    }

    let { view }: Props = $props();

    const initialQuery = getSearchQuery(view.state);

    let search = $state(initialQuery.search);
    let caseSensitive = $state(initialQuery.caseSensitive);
    let regexp = $state(initialQuery.regexp);
    let wholeWord = $state(initialQuery.wholeWord);

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
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) {
                findPrevious(view);
            } else {
                findNext(view);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            closeSearchPanel(view);
        }
    };
</script>

<div class="flex w-full items-center justify-between gap-1 p-2">
    <div class="flex grow items-center gap-1">
        <Input
            placeholder={$t("editor.search.placeholder")}
            type="text"
            bind:value={search}
            onkeydown={handleKeyDown}
            class="h-7 max-w-lg text-xs"
            main-field
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
        <Button
            variant="ghost"
            size="icon"
            onclick={() => findPrevious(view)}
            class="h-7 w-7"
            title={$t("editor.search.previous")}
            aria-label={$t("editor.search.previous")}
        >
            <ChevronUp class="h-3.5 w-3.5" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onclick={() => findNext(view)}
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
