<script lang="ts">
    import { move, type Tab, type TabPosition, updateCurrent } from "$lib/tab";
    import { cn } from "$lib/components/utils";
    import { ResizablePane } from "$lib/components/ui/resizable";
    import { PaneHeader, PaneHeaderItem } from "./header";
    import { dndzone } from "svelte-dnd-action";
    import type { EventHandler } from "$lib/event";
    import { type Snippet, untrack } from "svelte";
    import { ResizableHandle } from "$lib/components/ui/resizable";
    import PaneMenu from "./menu.svelte";
    import { Plus } from "@lucide/svelte";
    import { paneIcon } from "$lib/components/icons";
    import type { PaneAPI } from "paneforge";
    import type { CloseType } from "./header/item.svelte";
    import { t } from "$lib/i18n";

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

    let { tabs, size, hidden, position, handler, children, handleBefore, handleAfter }: Props = $props();
    let posTabs = $derived(tabs.filter((t) => t.position === position));
    let posCurrent = $derived(posTabs.find((t) => t.active));

    let lastPinnedId = $derived.by(() => {
        const pinned = localTabs.filter((t) => t.pinned);
        return pinned.length > 0 ? pinned[pinned.length - 1].id : null;
    });

    let localTabs = $state.raw(posTabs);
    $effect(() => {
        const localTabs0 = untrack(() => localTabs);

        // pop removed tabs
        const updatedTabs = localTabs0.filter((a) => posTabs.some((b) => a.id === b.id));
        // now add newly added tabs
        updatedTabs.push(...posTabs.filter((b) => !localTabs0.some((a) => a.id === b.id)));

        localTabs = updatedTabs;
    });

    const normalizeTabs = (tabs: Tab[]) => {
        const pinned = tabs.filter((t) => t.pinned);
        const unpinned = tabs.filter((t) => !t.pinned);

        const ordered = [...pinned, ...unpinned];

        ordered.forEach((tab, index) => {
            tab.index = index;
            move(tab, position);
        });

        return ordered;
    };

    const finalizeMove = (e: CustomEvent<{ items: Tab[] }>) => {
        const items = e.detail.items;

        const pinnedCount = localTabs.filter((t) => t.pinned).length;

        // Clamp pinned tabs to pinned area
        const pinned = items.filter((t) => t.pinned);
        const unpinned = items.filter((t) => !t.pinned);

        // If someone tried to drag across the boundary, snap back
        const fixed =
            pinned.length !== pinnedCount ? normalizeTabs(localTabs) : normalizeTabs([...pinned, ...unpinned]);

        localTabs = fixed;
    };

    let Icon = $derived(paneIcon(position, false));

    // update PaneForge's internal size, so we don't get weird resizing behavior
    let pane: PaneAPI | undefined = $state();
    $effect(() => {
        if (!pane || typeof pane.getSize() !== "number" /* too early? */) return;

        if (hidden) {
            pane.collapse();
        } else {
            pane.expand();
        }
    });

    const handleClose = (type: CloseType, tab: Tab) => {
        if (!tabs) return;

        // Tabs in same pane, ordered by index
        const samePositionTabs = tabs
            .filter((t) => t.position === tab.position)
            .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

        const currentIndex = samePositionTabs.findIndex((t) => t.id === tab.id);

        if (currentIndex === -1) return;

        const isLast = currentIndex === samePositionTabs.length - 1;

        const targets = {
            self: [tab],
            others: samePositionTabs.filter((t) => t.id !== tab.id),
            right: isLast ? [] : samePositionTabs.slice(currentIndex + 1),
            all: samePositionTabs,
        } as const;

        const toClose = targets[type] ?? [];

        toClose.forEach(handler.close);
    };

    const handlePin = (value: boolean, tab: Tab) => {
        if (tab.pinned === value) return;

        tab.pinned = value;

        const tabsInPane = [...localTabs];

        // Remove tab from current position
        const withoutTab = tabsInPane.filter((t) => t.id !== tab.id);

        const pinned = withoutTab.filter((t) => t.pinned);
        const unpinned = withoutTab.filter((t) => !t.pinned);

        localTabs = normalizeTabs([...pinned, tab, ...unpinned]);
    };
</script>

{#if handleBefore}<ResizableHandle class={cn(hidden && "hidden")} />{/if}
<ResizablePane defaultSize={size} collapsedSize={0} collapsible class={cn(hidden && "hidden")} bind:this={pane}>
    <div class="flex h-full w-full flex-col">
        <PaneHeader>
            <div
                class={cn("flex grow flex-row")}
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
                        name={tab0.name ?? $t(`tab.${tab0.type}`)}
                        active={posCurrent?.id === tab0.id}
                        icon={tab0.icon}
                        closeable={tab0.closeable}
                        pinned={tab0.pinned}
                        separate={lastPinnedId && tab0.id === lastPinnedId()}
                        onclick={() => updateCurrent(position, tab0)}
                        onclose={(type) => handleClose(type, tab0)}
                        onpin={(value) => handlePin(value, tab0)}
                    />
                {/each}
            </div>
            <PaneMenu align="end" offset {position} {handler}>
                {#snippet children(props)}
                    <div
                        {...props}
                        class="text-primary/60 flex h-8 min-h-8 w-8 min-w-8 cursor-pointer items-center justify-center"
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
            <div class="flex h-full w-full items-center justify-center overflow-y-auto">
                <div class="flex w-2/3 flex-col justify-center gap-6">
                    <div>
                        <Icon size={24} class="mb-4" />
                        <p class="mb-0.5 text-lg">{$t("pane.empty.title")}</p>
                        <p class="text-muted-foreground text-sm">{$t("pane.empty.subtitle")}</p>
                    </div>
                    <PaneMenu align="start" {position} {handler} />
                </div>
            </div>
        {/if}
    </div>
</ResizablePane>
{#if handleAfter}<ResizableHandle class={cn(hidden && "hidden")} />{/if}
