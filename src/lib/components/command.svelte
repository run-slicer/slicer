<script lang="ts" context="module">
    export enum Page {
        SEARCH,
    }
</script>

<script lang="ts">
    import {
        Command,
        CommandDialog,
        CommandInput,
        CommandList,
        CommandGroup,
        CommandItem,
        CommandEmpty,
    } from "$lib/components/ui/command";
    import VirtualList from "./list.svelte";
    import { onMount } from "svelte";
    import type { Entry } from "$lib/workspace";
    import { fileIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import { type EntryAction, ActionType, handle } from "$lib/action";
    import { Search } from "lucide-svelte";

    export let entries: Entry[];

    let open = false;
    let page: Page | null = null;

    $: {
        // reset page on close
        if (!open) {
            page = null;
        }
    }

    let search = "";
    const filter = (entries: Entry[], term: string): Entry[] => {
        return entries
            .filter((e) => e.name.includes(term))
            .sort((a, b) => a.name.length - term.length - (b.name.length - term.length));
    };

    $: filtered = page === Page.SEARCH && search ? filter(entries, search) : entries;

    let shift = false;
    onMount(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                if (shift) {
                    open = true;
                }

                shift = true;
                setTimeout(() => (shift = false), 250);
            }
        };

        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    });

    const handleClick = async (entry: Entry) => {
        open = false;
        await handle({ type: ActionType.OPEN, entry } as EntryAction);
    };
</script>

<CommandDialog bind:open shouldFilter={page !== Page.SEARCH}>
    <CommandInput bind:value={search} placeholder="Type a command or search..." />
    {#if page === Page.SEARCH}
        <CommandList class="h-[80vh] max-h-[80vh] [&>div]:contents">
            {#if entries.length > 0}
                <CommandGroup alwaysRender class="h-full !p-0 [&>div]:h-full">
                    <VirtualList data={filtered} getKey={(e) => e.name} let:item={entry} class="overflow-y-auto p-2">
                        <CommandItem class="!py-2.5 text-xs" onSelect={() => handleClick(entry)}>
                            {@const icon = fileIcon(entry.shortName)}
                            <svelte:component
                                this={icon.icon}
                                size={16}
                                class={cn("mr-2 !w-[16px] min-w-[16px]", icon.classes)}
                            />
                            <span>{entry.name}</span>
                        </CommandItem>
                    </VirtualList>
                </CommandGroup>
            {:else}
                <p class="py-4 text-center text-sm text-muted-foreground">
                    There's nothing here? Add something to the workspace.
                </p>
            {/if}
        </CommandList>
    {:else}
        <CommandList>
            <CommandEmpty class="px-2 py-1">
                <Command>
                    <CommandList>
                        <CommandItem onSelect={() => (page = Page.SEARCH)}>
                            <Search class="mr-2" />
                            <span>Search '{search}' in workspace</span>
                        </CommandItem>
                    </CommandList>
                </Command>
            </CommandEmpty>
            <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => (page = Page.SEARCH)}>
                    <Search class="mr-2" />
                    <span>Search workspace</span>
                </CommandItem>
            </CommandGroup>
        </CommandList>
    {/if}
</CommandDialog>
