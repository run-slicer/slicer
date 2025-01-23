<script lang="ts">
    import { move, type Tab, TabPosition, updateCurrent } from "$lib/tab";
    import { cn } from "$lib/components/utils";
    import { ResizablePane } from "$lib/components/ui/resizable";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import { dndzone } from "svelte-dnd-action";
    import { writable } from "svelte/store";
    import type { EventHandler } from "$lib/event";
    import type { Snippet } from "svelte";
    import { ResizableHandle } from "$lib/components/ui/resizable";

    interface Props {
        current: Map<TabPosition, Tab>;
        tabs: Tab[];
        size?: number;
        hidden?: boolean;
        position: TabPosition;
        handler: EventHandler;
        children?: Snippet<[Tab]>;

        handleBefore?: boolean;
        handleAfter?: boolean;
    }

    let {
        current = $bindable(),
        tabs,
        size,
        hidden = $bindable(),
        position,
        handler,
        children,
        handleBefore,
        handleAfter,
    }: Props = $props();
    let posTabs = $derived(tabs.filter((t) => t.position === position));
    let posCurrent = $derived(current.get(position) || null);

    const localTabs = writable(posTabs);
    $effect(() => {
        localTabs.update((localTabs0) => {
            // pop removed tabs
            const updatedTabs = localTabs0.filter((a) => posTabs.some((b) => a.id === b.id));
            // now add newly added tabs
            updatedTabs.push(...posTabs.filter((b) => !localTabs0.some((a) => a.id === b.id)));

            return updatedTabs;
        });
    });

    const finalizeMove = (e: CustomEvent<{ items: Tab[] }>) => {
        const items = e.detail.items;
        $localTabs = items;

        for (const tab of items) {
            move(tab, position);
        }
    };
</script>

{#if handleBefore}<ResizableHandle class={cn(!hidden || "hidden")} />{/if}
<ResizablePane defaultSize={size} class={cn(!hidden || "hidden")}>
    <div class="flex h-full w-full flex-col">
        <PaneHeader>
            <div
                class="flex w-full"
                use:dndzone={{ items: $localTabs, dropTargetStyle: {} }}
                onconsider={(e) => ($localTabs = e.detail.items)}
                onfinalize={finalizeMove}
            >
                {#each $localTabs as tab0 (tab0.id)}
                    <PaneHeaderItem
                        name={tab0.name}
                        active={posCurrent?.id === tab0.id}
                        icon={tab0.icon}
                        closeable={tab0.closeable}
                        onclick={() => updateCurrent(position, tab0)}
                        onclose={() => handler.close(tab0)}
                    />
                {/each}
            </div>
        </PaneHeader>
        {#each posTabs as tab0 (tab0.internalId)}
            <div class={cn("relative flex h-full min-h-0 w-full flex-col", posCurrent?.id === tab0.id || "hidden")}>
                {@render children?.(tab0)}
            </div>
        {/each}
    </div>
</ResizablePane>
{#if handleAfter}<ResizableHandle class={cn(!hidden || "hidden")} />{/if}
