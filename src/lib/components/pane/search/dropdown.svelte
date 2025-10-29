<script lang="ts">
    import { buttonVariants } from "$lib/components/ui/button";
    import {
        DropdownMenu,
        DropdownMenuTrigger,
        DropdownMenuContent,
        DropdownMenuRadioGroup,
        DropdownMenuRadioItem,
        DropdownMenuSeparator,
        DropdownMenuCheckboxItem,
    } from "$lib/components/ui/dropdown-menu";
    import { cn } from "$lib/components/utils";
    import { SearchMode } from "$lib/workspace/analysis";
    import { ChevronsUpDown } from "@lucide/svelte";
    import { QueryType } from "$lib/workspace/analysis/search";
    import { t } from "$lib/i18n";

    interface Props {
        type: QueryType;
        mode: SearchMode;
        ref: boolean;
        disabled?: boolean;
    }

    let { type = $bindable(), mode = $bindable(), ref = $bindable(), disabled }: Props = $props();
</script>

<DropdownMenu>
    <DropdownMenuTrigger
        {disabled}
        class={cn(buttonVariants({ variant: "outline" }), "min-w-44 justify-between rounded-r-none border-r-0")}
    >
        {$t(`pane.search.menu.type.${type}`)}
        <ChevronsUpDown class="opacity-50" />
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-44" align="start">
        <DropdownMenuRadioGroup bind:value={type}>
            {#each Object.values(QueryType) as queryType}
                <DropdownMenuRadioItem value={queryType}>
                    {$t(`pane.search.menu.type.${queryType}`)}
                </DropdownMenuRadioItem>
            {/each}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
            bind:checked={ref}
            disabled={type === QueryType.PSEUDOCODE || type === QueryType.STRING}
        >
            {$t("pane.search.menu.ref")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup bind:value={mode}>
            {#each Object.values(SearchMode) as searchMode}
                <DropdownMenuRadioItem value={searchMode}>
                    {$t(`pane.search.menu.mode.${searchMode}`)}
                </DropdownMenuRadioItem>
            {/each}
        </DropdownMenuRadioGroup>
    </DropdownMenuContent>
</DropdownMenu>
