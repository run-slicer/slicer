<script lang="ts">
    import { VList } from "virtua/svelte";
    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import type { SearchResult } from "$lib/workspace/analysis";
    import { t } from "$lib/i18n";
    import type { EventHandler } from "$lib/event";
    import { groupBy } from "$lib/utils";
    import { memberEntry } from "$lib/workspace";

    interface Props {
        open: boolean;
        data: SearchResult[];
        handler: EventHandler;
    }

    let { open = $bindable(), data, handler }: Props = $props();
    let grouped = $derived(groupBy(data, (usage) => usage.entry.name));
</script>

<div class="divide-border flex h-full flex-col divide-y">
    <div class="bg-muted/30 flex items-center gap-1 px-2 py-1.5">
        <span class="text-muted-foreground mr-2 text-xs">
            {$t("modal.usages.info", data.length)}
        </span>
    </div>

    <div class="min-h-0 flex-1">
        <VList data={Array.from(grouped.entries())} class="h-full overflow-x-hidden pb-2">
            {#snippet children([name, usages])}
                {@const { icon: Icon, classes: iconClasses } = entryIcon(usages[0].entry)}

                <div class="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                    <Icon class={cn(iconClasses, "h-4 w-4 shrink-0")} />
                    <span class="text-foreground">{name}</span>
                    <span class="text-muted-foreground text-xs">({usages.length})</span>
                </div>

                {#each usages as usage}
                    {@const entry =
                        usage.member?.type?.string?.charAt(0) === "("
                            ? memberEntry(usage.entry, usage.member)
                            : usage.entry}
                    <button
                        ondblclick={() => {
                            open = false;
                            handler.open(entry);
                        }}
                        class="hover:bg-accent/50 focus:bg-accent ml-6 flex w-[calc(100%-2rem)] flex-col gap-1 rounded-sm px-3 py-1.5 text-left transition-colors"
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
