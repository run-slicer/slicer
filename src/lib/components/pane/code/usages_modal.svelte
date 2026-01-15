<script lang="ts">
    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import type { SearchResult } from "$lib/workspace/analysis";
    import { t } from "$lib/i18n";
    import type { EventHandler } from "$lib/event";
    import { classes } from "$lib/workspace";
    import { get } from "svelte/store";

    interface Props {
        open: boolean;
        data: SearchResult[];
        handler: EventHandler;
    }

    let { open = $bindable(), data, handler }: Props = $props();
    const workspaceClasses = get(classes);

    type GroupedUsages = {
        className: string;
        entry: SearchResult["entry"];
        usages: SearchResult[];
    };

    // Group usages by class name
    const grouped = $derived(
        Object.values(
            data.reduce<Record<string, GroupedUsages>>((acc, usage) => {
                const key = usage.entry.name;

                if (!acc[key]) {
                    acc[key] = {
                        className: key,
                        entry: usage.entry,
                        usages: [],
                    };
                }

                acc[key].usages.push(usage);
                return acc;
            }, {})
        )
    );

    let selected: SearchResult | null = $state(null);
</script>

<div class="divide-border divide-y">
    <!-- Toolbar -->
    <div class="bg-muted/30 flex items-center gap-1 px-2 py-1.5">
        <span class="text-muted-foreground mr-2 text-xs">
            {$t("modal.usages.info", [data.length])}
        </span>
    </div>

    <!-- Usage list -->
    <div class="overflow-x-hidden py-1">
        {#each grouped as group, gi}
            {@const { icon: Icon, classes: iconClasses } = entryIcon(group.entry)}

            <!-- Class header -->
            <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                <Icon class={cn(iconClasses, "h-4 w-4 shrink-0")} />
                <span class="text-foreground">{group.className}</span>
                <span class="text-muted-foreground text-xs">
                    ({group.usages.length})
                </span>
            </div>

            <!-- Class usages -->
            {#each group.usages as usage, ui}
                <button
                    onclick={() => {
                        if (selected !== usage) {
                            selected = usage;
                            return;
                        }

                        open = false;

                        const classEntry = workspaceClasses.values().find((e) => e.name === usage.entry.name);

                        if (classEntry) handler.open(classEntry);
                    }}
                    class={cn(
                        "hover:bg-accent/50 ml-6 flex w-[calc(100%-1.5rem)] flex-col gap-1 px-3 py-1.5 text-left transition-colors",
                        selected === usage && "bg-accent"
                    )}
                >
                    <code class="text-foreground truncate font-mono text-xs">
                        {usage.value}
                    </code>
                </button>
            {/each}
        {/each}
    </div>
</div>
