<script lang="ts">
    import { ChevronsUpDown, Folders, Sparkles, Terminal } from "lucide-svelte";
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
    import { type TabPosition, TabType } from "$lib/tab";
    import type { Icon } from "$lib/components/icons";
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

    interface TabDefinition {
        id: TabType;
        name: string;
        icon: Icon;
    }

    const defs: TabDefinition[] = [
        {
            id: TabType.PROJECT,
            name: "Project",
            icon: Folders,
        },
        {
            id: TabType.LOGGING,
            name: "Logging",
            icon: Terminal,
        },
        {
            id: TabType.WELCOME,
            name: "Welcome",
            icon: Sparkles,
        },
    ];

    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);
</script>

<Popover bind:open>
    <PopoverTrigger bind:ref={triggerRef}>
        {#snippet child({ props })}
            {#if children}
                {@render children(props)}
            {:else}
                <Button
                    variant="outline"
                    class="w-[200px] justify-between"
                    {...props}
                    role="combobox"
                    aria-expanded={open}
                >
                    Select a tab... <ChevronsUpDown class="opacity-50" />
                </Button>
            {/if}
        {/snippet}
    </PopoverTrigger>
    <PopoverContent {align} class={cn("w-[200px] p-0", !offset || `m${align === "end" ? "r" : "l"}-1`)}>
        <Command>
            <CommandInput placeholder="Search tab..." />
            <CommandList>
                <CommandEmpty>No tab found.</CommandEmpty>
                <CommandGroup>
                    {#each defs as def}
                        {@const Icon = def.icon}
                        <CommandItem
                            value={def.id}
                            onSelect={async () => {
                                open = false;
                                await handler.openRaw(def.id, def.name, def.icon, position);
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
