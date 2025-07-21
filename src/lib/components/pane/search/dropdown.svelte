<script lang="ts" module>
    import { QueryType } from "$lib/workspace/analysis";

    export const types = [
        {
            value: QueryType.PSEUDOCODE,
            label: "Pseudocode",
        },
        {
            value: QueryType.STRING,
            label: "Strings",
        },
        {
            value: QueryType.FIELD,
            label: "Fields",
        },
        {
            value: QueryType.METHOD,
            label: "Methods",
        },
    ];
</script>

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

    interface Props {
        type: QueryType;
        mode: SearchMode;
        ref: boolean;
        disabled?: boolean;
    }

    let { type = $bindable(), mode = $bindable(), ref = $bindable(), disabled }: Props = $props();

    let currentType = $derived(types.find((t) => t.value === type)!);
</script>

<DropdownMenu>
    <DropdownMenuTrigger
        {disabled}
        class={cn(buttonVariants({ variant: "outline" }), "min-w-44 justify-between rounded-r-none border-r-0")}
    >
        {currentType.label}
        <ChevronsUpDown class="opacity-50" />
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-44" align="start">
        <DropdownMenuRadioGroup bind:value={type}>
            {#each types as type}
                <DropdownMenuRadioItem value={type.value}>{type.label}</DropdownMenuRadioItem>
            {/each}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
            bind:checked={ref}
            disabled={type === QueryType.PSEUDOCODE || type === QueryType.STRING}
        >
            Reference
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup bind:value={mode}>
            <DropdownMenuRadioItem value={SearchMode.PARTIAL_MATCH}>Partial match</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={SearchMode.EXACT_MATCH}>Exact match</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={SearchMode.REGEXP}>RegExp match</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
    </DropdownMenuContent>
</DropdownMenu>
