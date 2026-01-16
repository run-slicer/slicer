<script lang="ts">
    import { t } from "$lib/i18n";
    import { Layers, ChevronRight, Server, LayoutDashboard, FileCodeCorner, LayoutList } from "@lucide/svelte";
    import { cn } from "$lib/components/utils";
    import { ENTRY_POINT_TYPES, EntryType, type ClassEntry, type Entry, type EntryPointType } from "$lib/workspace";
    import { entryIcon, entryPointIcon } from "$lib/components/icons";
    import handler from "$lib/event/handler";
    import { Button } from "$lib/components/ui/button";

    interface Props {
        classes: Map<string, Entry>;
        entries: Entry[];
        currentEntry?: Entry | null;
        showSummary: boolean;
    }

    let { classes, entries, currentEntry = $bindable(), showSummary = $bindable() }: Props = $props();

    let selectedEntry = $state<ClassEntry | null>(null);

    let collapsed = $state<Record<EntryPointType, boolean>>(
        Object.fromEntries(ENTRY_POINT_TYPES.map((type) => [type, false])) as Record<EntryPointType, boolean>
    );

    function handleNavigate(entry: ClassEntry) {
        handler.open(entry);
    }

    let groupedEntryPoints = $derived.by(() => {
        const groups = Object.fromEntries(ENTRY_POINT_TYPES.map((type) => [type, [] as ClassEntry[]])) as Record<
            EntryPointType,
            ClassEntry[]
        >;

        classes.forEach((entry) => {
            if (entry.type !== EntryType.CLASS) return;

            const classEntry = entry as ClassEntry;
            classEntry.entryPoints?.forEach((type) => {
                groups[type]?.push(classEntry);
            });
        });

        return groups;
    });

    let activeTypes = $derived(
        (Object.entries(groupedEntryPoints) as [EntryPointType, ClassEntry[]][]).filter(
            ([_, entries]) => entries.length > 0
        )
    );
</script>

<div class="flex h-full w-full flex-col text-sm">
    <div class="border-border/50 border-b px-3 py-2.5">
        <div class="flex w-full justify-between">
            <div class="flex items-center gap-2">
                <LayoutDashboard class="text-foreground h-4 w-4" />
                <span class="text-foreground font-medium">{$t("pane.summary.title")}</span>
            </div>

            {#if currentEntry}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    class="text-muted-foreground ml-2 shrink-0"
                    onclick={() => (showSummary = false)}
                >
                    <LayoutList />
                </Button>
            {/if}
        </div>
        <div class="text-muted-foreground mt-1.5 flex items-center gap-3 text-xs">
            <span class="flex items-center gap-1">
                <Layers class="h-3 w-3" />
                {$t("pane.summary.total-classes", [classes.size.toLocaleString()])}
            </span>
            <span class="flex items-center gap-1">
                <FileCodeCorner class="h-3 w-3" />
                {$t("pane.summary.total-files", [entries.length.toLocaleString()])}
            </span>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto">
        <div class="px-3 py-2">
            <span class="text-muted-foreground/70 text-[11px] font-medium tracking-wider uppercase"
                >{$t("pane.summary.entry-points")}</span
            >
        </div>

        <div class="pb-2">
            {#each activeTypes as [type, entries]}
                {@const Icon = entryPointIcon(type)}

                <button
                    type="button"
                    onclick={() => (collapsed[type] = !collapsed[type])}
                    class="hover:bg-accent/40 group flex w-full items-center gap-2 px-3 py-1 transition-colors"
                >
                    <ChevronRight
                        class={cn(
                            "text-muted-foreground h-3.5 w-3.5 transition-transform",
                            !collapsed[type] && "rotate-90"
                        )}
                    />

                    <div class="flex h-5 w-5 items-center justify-center rounded">
                        <Icon class="text-muted-foreground h-3 w-3" />
                    </div>

                    <span class="text-muted-foreground text-xs font-medium">
                        {$t(`pane.summary.entry-points.${type}`)}
                    </span>

                    <span class="bg-muted/50 text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                        {entries.length}
                    </span>
                </button>

                <div
                    class={cn(
                        "overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out",
                        collapsed[type] ? "max-h-0 opacity-0" : "opacity-100"
                    )}
                >
                    {#each entries as entry}
                        {@const { icon: Icon, classes } = entryIcon(entry)}

                        <div
                            class={cn(
                                "pl-4.5 transition-colors",
                                selectedEntry?.name === entry.name ? "bg-accent/60" : "hover:bg-accent/50"
                            )}
                        >
                            <button
                                type="button"
                                onclick={() => (selectedEntry = entry)}
                                ondblclick={() => handleNavigate(entry)}
                                class={cn(
                                    "group flex w-full items-center gap-2 border-l py-1 pr-3 pl-4.5 text-left",
                                    selectedEntry?.name === entry.name ? "border-l-primary" : "border-l"
                                )}
                            >
                                <Icon size={16} class={cn("min-w-4", classes)} />

                                <span class="text-foreground/90 flex-1 truncate font-mono text-xs">
                                    {entry.node.thisClass.nameEntry?.string ?? entry.name}
                                </span>

                                <ChevronRight
                                    class="text-muted-foreground/50 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                                />
                            </button>
                        </div>
                    {/each}
                </div>
            {/each}

            {#if activeTypes.length === 0}
                <div class="text-muted-foreground flex flex-col items-center justify-center py-6 text-center">
                    <Server class="mb-2 h-5 w-5 opacity-50" />
                    <span class="text-xs">{$t("pane.summary.entry-points.none")}</span>
                </div>
            {/if}
        </div>
    </div>
</div>
