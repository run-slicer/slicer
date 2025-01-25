<script lang="ts" module>
    import { TabPosition } from "$lib/tab";
    import {
        InspectionPanel,
        PanelBottom,
        PanelBottomDashed,
        PanelLeft,
        PanelLeftDashed,
        PanelRight,
        PanelRightDashed,
    } from "lucide-svelte";
    import type { Icon } from "$lib/components/icons";

    export const pickIcon = (pos: TabPosition, open: boolean): Icon => {
        switch (pos) {
            case TabPosition.PRIMARY_BOTTOM:
                return open ? PanelBottom : PanelBottomDashed;
            case TabPosition.PRIMARY_CENTER:
                return InspectionPanel;
            case TabPosition.SECONDARY_LEFT:
                return open ? PanelLeft : PanelLeftDashed;
            case TabPosition.SECONDARY_RIGHT:
                return open ? PanelRight : PanelRightDashed;
        }
    };
</script>

<script lang="ts">
    import { move, type Tab, updateCurrent } from "$lib/tab";
    import { cn } from "$lib/components/utils";
    import { ResizablePane } from "$lib/components/ui/resizable";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import { dndzone } from "svelte-dnd-action";
    import type { EventHandler } from "$lib/event";
    import { type Snippet, untrack } from "svelte";
    import { ResizableHandle } from "$lib/components/ui/resizable";
    import PaneMenu from "./pane_menu.svelte";
    import { Plus } from "lucide-svelte";

    interface Props {
        tabs: Tab[];
        size?: number;
        hidden?: boolean;
        position: TabPosition;
        handler: EventHandler;
        children?: Snippet<[Tab]>;

        handleBefore?: boolean;
        handleAfter?: boolean;
    }

    let { tabs, size, hidden = $bindable(), position, handler, children, handleBefore, handleAfter }: Props = $props();
    let posTabs = $derived(tabs.filter((t) => t.position === position));
    let posCurrent = $derived(posTabs.find((t) => t.active));

    let localTabs = $state.raw(posTabs);
    $effect(() => {
        const localTabs0 = untrack(() => localTabs);

        // pop removed tabs
        const updatedTabs = localTabs0.filter((a) => posTabs.some((b) => a.id === b.id));
        // now add newly added tabs
        updatedTabs.push(...posTabs.filter((b) => !localTabs0.some((a) => a.id === b.id)));

        localTabs = updatedTabs;
    });

    const finalizeMove = (e: CustomEvent<{ items: Tab[] }>) => {
        const items = e.detail.items;
        localTabs = items;

        for (const tab of items) {
            move(tab, position);
        }
    };

    let Icon = $derived(pickIcon(position, false));
</script>

{#if handleBefore}<ResizableHandle class={cn(!hidden || "hidden")} />{/if}
<ResizablePane defaultSize={size} class={cn(!hidden || "hidden")}>
    <div class="flex h-full w-full flex-col">
        <PaneHeader>
            <div
                class="flex w-full"
                use:dndzone={{
                    items: localTabs,
                    dropTargetStyle: {},
                    dropAnimationDisabled: true,
                    centreDraggedOnCursor: true,
                }}
                onconsider={(e) => (localTabs = e.detail.items)}
                onfinalize={finalizeMove}
            >
                {#each localTabs as tab0 (tab0.id)}
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
            <PaneMenu offset align="end" {position} {handler}>
                {#snippet children(props)}
                    <div
                        class="flex h-8 min-h-8 w-8 min-w-8 cursor-pointer items-center justify-center text-primary/60"
                        {...props}
                    >
                        <Plus size={18} />
                    </div>
                {/snippet}
            </PaneMenu>
        </PaneHeader>
        {#if posTabs.length > 0}
            {#each posTabs as tab0 (tab0.internalId)}
                <div class={cn("relative flex h-full min-h-0 w-full flex-col", posCurrent?.id === tab0.id || "hidden")}>
                    {@render children?.(tab0)}
                </div>
            {/each}
        {:else}
            <div class="flex h-full w-full items-center justify-center">
                <div class="flex w-2/3 flex-col justify-center gap-6">
                    <div>
                        <Icon size={24} class="mb-4" />
                        <p class="mb-0.5 text-lg">Nothing here...</p>
                        <p class="text-sm text-muted-foreground">Open a new tab or move an existing one here.</p>
                    </div>
                    <PaneMenu align="start" {position} {handler} />
                </div>
            </div>
        {/if}
    </div>
</ResizablePane>
{#if handleAfter}<ResizableHandle class={cn(!hidden || "hidden")} />{/if}
