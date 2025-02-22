<script lang="ts" module>
    import { QueryType } from "$lib/workspace/analysis";

    export const choices = [
        {
            value: QueryType.POOL_ENTRY,
            label: "Constant pool",
        },
        {
            value: QueryType.MEMBER,
            label: "Members",
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
    } from "$lib/components/ui/dropdown-menu";
    import { cn } from "$lib/components/utils";
    import { ChevronsUpDown } from "lucide-svelte";

    interface Props {
        value: QueryType;
    }

    let { value = $bindable() }: Props = $props();

    let current = $derived(choices.find((c) => c.value === value)!);
</script>

<DropdownMenu>
    <DropdownMenuTrigger
        class={cn(buttonVariants({ variant: "outline" }), "min-w-44 justify-between rounded-r-none border-r-0")}
    >
        {current.label}
        <ChevronsUpDown class="opacity-50" />
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-44" align="start">
        <DropdownMenuRadioGroup bind:value>
            {#each choices as choice}
                <DropdownMenuRadioItem value={choice.value}>{choice.label}</DropdownMenuRadioItem>
            {/each}
        </DropdownMenuRadioGroup>
    </DropdownMenuContent>
</DropdownMenu>
