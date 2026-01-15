<script lang="ts">
    import { VList } from "virtua/svelte";

    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import type { SearchResult } from "$lib/workspace/analysis";
    import { t } from "$lib/i18n";
    import type { EventHandler } from "$lib/event";
    import { type Entry } from "$lib/workspace";

    interface Props {
        open: boolean;
        data: SearchResult[];
        handler: EventHandler;
        classes: Map<string, Entry>;
    }

    let { open = $bindable(), data, handler, classes }: Props = $props();

    type GroupedUsages = {
        className: string;
        entry: SearchResult["entry"];
        usages: SearchResult[];
    };

    // Group usages by class
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

    type Row = { type: "header"; group: GroupedUsages } | { type: "usage"; usage: SearchResult };

    // Flatten grouped structure for virtualization
    const rows = $derived.by(() => {
        const result: Row[] = [];

        for (const group of grouped) {
            result.push({ type: "header", group });

            for (const usage of group.usages) {
                result.push({ type: "usage", usage });
            }
        }

        return result;
    });

    let selected: SearchResult | null = $state(null);
</script>

<div class="divide-border divide-y flex h-87.5 flex-col">
    <!-- Toolbar -->
    <div class="bg-muted/30 flex items-center gap-1 px-2 py-1.5">
        <span class="text-muted-foreground mr-2 text-xs">
            {$t("modal.usages.info", [data.length])}
        </span>
    </div>

    <!-- Virtualized usage list -->
    <div class="min-h-0 flex-1">
        <VList data={rows} class="h-full overflow-x-hidden">
            {#snippet children(item)}
                {#if item.type === "header"}
                    {@const { icon: Icon, classes: iconClasses } = entryIcon(item.group.entry)}

                    <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                        <Icon class={cn(iconClasses, "h-4 w-4 shrink-0")} />
                        <span class="text-foreground">
                            {item.group.className}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            ({item.group.usages.length})
                        </span>
                    </div>
                {:else}
                    <button
                        onclick={() => {
                            if (selected !== item.usage) {
                                selected = item.usage;
                                return;
                            }

                            open = false;

                            const classEntry = [...classes.values()].find((e) => e.name === item.usage.entry.name);

                            if (classEntry) handler.open(classEntry);
                        }}
                        class={cn(
                            "hover:bg-accent/50 ml-6 flex w-[calc(100%-1.5rem)] flex-col gap-1 px-3 py-1.5 text-left transition-colors",
                            selected === item.usage && "bg-accent"
                        )}
                    >
                        <code class="text-foreground truncate font-mono text-xs">
                            {item.usage.value}
                        </code>
                    </button>
                {/if}
            {/snippet}
        </VList>
    </div>
</div>
