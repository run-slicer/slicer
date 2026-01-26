<script lang="ts">
    import { VList } from "virtua/svelte";
    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import { QueryType, search, SearchMode, type SearchResult } from "$lib/workspace/analysis";
    import { t } from "$lib/i18n";
    import type { EventHandler } from "$lib/event";
    import { type Cancellable, groupBy } from "$lib/utils";
    import { type Entry, memberEntry } from "$lib/workspace";
    import { error } from "$lib/log";
    import { toast } from "svelte-sonner";

    interface Props {
        open: boolean;
        name: string | null;
        classes: Map<string, Entry>;
        handler: EventHandler;
    }

    let { open = $bindable(), name, classes, handler }: Props = $props();

    let usages: SearchResult[] = $state.raw([]);
    let task: Cancellable<void> | null = $state(null);

    $effect(() => {
        if (!open || !name) return;

        try {
            usages = [];
            task = search(
                Array.from(classes.values()),
                { type: QueryType.PSEUDOCODE, value: name, mode: SearchMode.PARTIAL_MATCH, ref: true },
                (res) => {
                    usages = [...usages, res];
                }
            );
        } catch (e) {
            error("failed to search", e);
            toast.error($t("toast.error.title.generic"), {
                description: $t("toast.error.search"),
            });
        }
    })

    $effect(() => {
        if (!open) {
            usages = [];
            task?.cancel();
            task = null;
        }
    });

    let grouped = $derived(groupBy(usages, (usage) => usage.entry.name));
</script>

<div class="divide-border flex h-full flex-col divide-y">
    <div class="bg-muted/30 flex items-center gap-1 px-2 py-1.5">
        <span class="text-muted-foreground mr-2 text-xs">
            {$t("modal.usages.info", usages.length)}
        </span>
    </div>

    <div class="min-h-0 flex-1">
        <VList data={Array.from(grouped.entries())} getKey={([name]) => name} class="h-full overflow-x-hidden p-1">
            {#snippet children([name, usages])}
                {@const { icon: Icon, classes: iconClasses } = entryIcon(usages[0].entry)}

                <div class="flex items-center gap-2 px-2 py-1 text-sm font-medium">
                    <Icon class={cn(iconClasses, "h-4 w-4 shrink-0")} />
                    <span class="text-foreground">{name}</span>
                    <span class="text-muted-foreground text-xs">({usages.length})</span>
                </div>

                {#each usages as usage}
                    {@const entry =
                        usage.member?.type?.string?.charAt(0) === "("
                            ? memberEntry(usage.entry, usage.member)
                            : usage.entry
                    }
                    <button
                        ondblclick={() => {
                            open = false;
                            handler.open(entry);
                        }}
                        class="hover:bg-accent/50 focus:bg-accent ml-6 flex w-[calc(100%-2rem)] flex-col gap-1 rounded-sm px-2 py-1 text-left transition-colors"
                    >
                        <code class="text-foreground truncate font-mono text-xs">
                            {usage.value}
                        </code>
                    </button>
                {/each}
            {/snippet}
        </VList>
    </div>
</div>
