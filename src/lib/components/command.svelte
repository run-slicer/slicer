<script lang="ts">
    import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from "$lib/components/ui/command";
    import { onMount } from "svelte";
    import { type Entry } from "$lib/workspace";
    import { entryIcon } from "$lib/components/icons";
    import { Search } from "@lucide/svelte";
    import { cn } from "$lib/components/utils";
    import { VList } from "virtua/svelte";
    import type { EventHandler } from "$lib/event";

    interface Props {
        entries: Entry[];
        handler: EventHandler;
    }

    let { entries, handler }: Props = $props();

    let open = $state(false);
    let searchWorkspace = $state(false);

    $effect(() => {
        // reset page on close
        if (!open) {
            searchWorkspace = false;
        }
    });

    let search = $state("");
    const filter = (entries: Entry[], term: string): Entry[] => {
        return entries
            .filter((e) => e.name.includes(term))
            .sort((a, b) => a.name.length - term.length - (b.name.length - term.length));
    };

    let filteredEntries = $derived(search && searchWorkspace ? filter(entries, search) : entries);

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
        await handler.open(entry);
    };
</script>

<CommandDialog bind:open shouldFilter={!searchWorkspace}>
    <CommandInput bind:value={search} placeholder={searchWorkspace ? "Search files..." : "Type a command..."} />
    <CommandList class={cn(!searchWorkspace || "h-[80vh] max-h-[80vh] [&>div]:contents")}>
        {#if searchWorkspace}
            {#if entries.length > 0}
                {#key filteredEntries.length}
                    <VList data={filteredEntries} getKey={(e) => e.name} class="p-2">
                        {#snippet children(entry)}
                            <CommandItem class="py-2.5!" onSelect={() => handleClick(entry)}>
                                {@const { icon: Icon, classes } = entryIcon(entry)}
                                <Icon class={classes} />
                                <span class="break-anywhere">{entry.name}</span>
                            </CommandItem>
                        {/snippet}
                    </VList>
                {/key}
            {:else}
                <p class="text-muted-foreground py-4 text-center text-sm">
                    There's nothing here? Add something to the workspace.
                </p>
            {/if}
        {:else}
            <CommandGroup forceMount heading="Workspace">
                <CommandItem forceMount value="Search workspace" onSelect={() => (searchWorkspace = true)}>
                    <Search />
                    {#if search}
                        <span>Search '{search}' in workspace</span>
                    {:else}
                        <span>Search workspace</span>
                    {/if}
                </CommandItem>
            </CommandGroup>
        {/if}
    </CommandList>
</CommandDialog>
