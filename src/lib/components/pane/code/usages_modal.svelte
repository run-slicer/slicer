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
    let selectedIndex = $state(0);
    const workspaceClasses = get(classes);
</script>

<div class="divide-border divide-y">
    <!-- Toolbar -->
    <div class="bg-muted/30 flex items-center gap-1 px-2 py-1.5">
        <span class="text-muted-foreground mr-2 text-xs">
            {$t("modal.usages.info", [data.length])}
        </span>
    </div>

    <!-- Usage list -->
    <div class="py-1 overflow-x-hidden">
        {#each data as usage, i}
            {@const { icon: Icon, classes: iconClasses } = entryIcon(usage.entry)}
            <button
                onclick={() => {
                    if (selectedIndex !== i) {
                        selectedIndex = i;
                        return;
                    }

                    open = false;

                    const classEntry = workspaceClasses.values().find((e) => e.name === usage.entry.name);

                    if (!classEntry) return;
                    
                    handler.open(classEntry);
                }}
                class="hover:bg-accent/50 flex w-full flex-col gap-2 px-3 py-1.5 text-left transition-colors {selectedIndex ===
                i
                    ? 'bg-accent'
                    : ''}"
            >
                <div class="flex items-center gap-2">
                    <Icon class={cn(iconClasses, "h-4 w-4 shrink-0")} />
                    <span class="text-foreground text-sm">{usage.entry.name}</span>
                </div>
                <code class="text-foreground flex-1 truncate px-6 font-mono text-xs">{usage.value}</code>
            </button>
        {/each}
    </div>
</div>
