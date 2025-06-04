<script lang="ts" module>
    import { QueryType, SearchMode } from "$lib/workspace/analysis";

    export const types = [
        {
            value: QueryType.POOL_ENTRY,
            label: "Constant pool",
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
    export const modes = [
        {
            value: SearchMode.PARTIAL_MATCH,
            label: "Partial match",
        },
        {
            value: SearchMode.EXACT_MATCH,
            label: "Exact match",
        },
        {
            value: SearchMode.REGEXP,
            label: "Regular expression",
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
    } from "$lib/components/ui/dropdown-menu";
    import { cn } from "$lib/components/utils";
    import { ChevronsUpDown } from "@lucide/svelte";

    interface Props {
        type: QueryType;
        mode: SearchMode;
        disabled?: boolean;
    }

    let { type = $bindable(), mode = $bindable(), disabled }: Props = $props();

    let currentType = $derived(types.find((t) => t.value === type)!);
</script>

<DropdownMenu>
    <DropdownMenuTrigger
        {disabled}
        class={cn(buttonVariants({ variant: "outline-solid" }), "min-w-44 justify-between rounded-r-none border-r-0")}
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
        <DropdownMenuRadioGroup bind:value={mode}>
            {#each modes as mode}
                <DropdownMenuRadioItem value={mode.value}>{mode.label}</DropdownMenuRadioItem>
            {/each}
        </DropdownMenuRadioGroup>
    </DropdownMenuContent>
</DropdownMenu>
