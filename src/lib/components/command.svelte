<script lang="ts">
    import { t } from "$lib/i18n";
    import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from "$lib/components/ui/command";
    import { onMount } from "svelte";
    import type { Entry } from "$lib/workspace";
    import { entryIcon } from "$lib/components/icons";
    import { Search } from "@lucide/svelte";
    import { cn } from "$lib/components/utils";
    import { VList } from "virtua/svelte";
    import type { EventHandler } from "$lib/event";
    import { tabDefs, TabPosition } from "$lib/tab";

    interface Props {
        entries: Entry[];
        handler: EventHandler;
    }

    let { entries, handler }: Props = $props();

    let open = $state(false);
    let searchWorkspace = $state(false);
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
</script>

<CommandDialog
    bind:open
    shouldFilter={!searchWorkspace}
    onOpenChangeComplete={(open) => {
        // reset page on close
        if (!open) {
            searchWorkspace = false;
            search = "";
        }
    }}
>
    <CommandInput
        bind:value={search}
        placeholder={$t(searchWorkspace ? "command.workspace.search.placeholder" : "command.placeholder")}
    />
    <CommandList class={cn(!searchWorkspace || "h-[80vh] max-h-[80vh] [&>div]:contents")}>
        {#if searchWorkspace}
            {#if entries.length > 0}
                {#key filteredEntries.length}
                    <VList data={filteredEntries} getKey={(e) => e.name} class="p-2">
                        {#snippet children(entry)}
                            <CommandItem
                                class="py-2.5!"
                                onSelect={async () => {
                                    open = false;
                                    await handler.open(entry);
                                }}
                            >
                                {@const { icon: Icon, classes } = entryIcon(entry)}
                                <Icon class={classes} />
                                <span class="break-anywhere">{entry.name}</span>
                            </CommandItem>
                        {/snippet}
                    </VList>
                {/key}
            {:else}
                <p class="text-muted-foreground py-4 text-center text-sm">
                    {$t("command.workspace.search.no-entries")}
                </p>
            {/if}
        {:else}
            <CommandGroup heading={$t("command.tabs")}>
                {#each tabDefs as def}
                    {@const Icon = def.icon}
                    <CommandItem
                        value={def.type}
                        onSelect={async () => {
                            open = false;
                            await handler.openUnscoped(def, TabPosition.PRIMARY_CENTER, false);
                        }}
                    >
                        <Icon />
                        {$t(`tab.${def.type}`)}
                    </CommandItem>
                {/each}
            </CommandGroup>
            <CommandGroup forceMount heading={$t("command.workspace")}>
                <CommandItem
                    forceMount
                    value={$t("command.workspace.search")}
                    onSelect={() => (searchWorkspace = true)}
                >
                    <Search />
                    {#if search}
                        <span>{$t("command.workspace.search.contextual", search)}</span>
                    {:else}
                        <span>{$t("command.workspace.search")}</span>
                    {/if}
                </CommandItem>
            </CommandGroup>
        {/if}
    </CommandList>
</CommandDialog>
