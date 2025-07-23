<script lang="ts">
    import { ChevronsUpDown } from "@lucide/svelte";
    import {
        Command,
        CommandEmpty,
        CommandGroup,
        CommandInput,
        CommandItem,
        CommandList,
    } from "$lib/components/ui/command";
    import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import type { EventHandler } from "$lib/event";
    import { type TabPosition, tabDefs } from "$lib/tab";
    import type { Snippet } from "svelte";
    import { cn } from "$lib/components/utils";

    interface Props {
        position: TabPosition;
        align?: "center" | "start" | "end";
        offset?: boolean;
        handler: EventHandler;
        children?: Snippet<[any]>;
    }

    let { position, align, offset, handler, children }: Props = $props();

    let open = $state(false);
</script>

<Popover bind:open>
    <PopoverTrigger class="max-w-[180px]">
        {#snippet child({ props })}
            {#if children}
                {@render children(props)}
            {:else}
                <Button
                    variant="outline"
                    class="w-[180px] justify-between"
                    {...props}
                    role="combobox"
                    aria-expanded={open}
                >
                    Select a tab... <ChevronsUpDown class="opacity-50" />
                </Button>
            {/if}
        {/snippet}
    </PopoverTrigger>
    <PopoverContent {align} class={cn("w-[180px] p-0", !offset || "mr-1")}>
        <Command>
            <CommandInput placeholder="Search tab..." />
            <CommandList>
                <CommandEmpty>No tab found.</CommandEmpty>
                <CommandGroup>
                    {#each tabDefs as def}
                        {@const Icon = def.icon}
                        <CommandItem
                            value={def.type}
                            onSelect={async () => {
                                open = false;
                                await handler.openUnscoped(def, position, true);
                            }}
                        >
                            <Icon />
                            {def.name}
                        </CommandItem>
                    {/each}
                </CommandGroup>
            </CommandList>
        </Command>
    </PopoverContent>
</Popover>
