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

        const samePosition = (t: Tab) => t.position === tab.position;
        const filteredTabs = tabs.filter(samePosition);

        const localIndex = filteredTabs.findIndex((t) => t.id === tab.id);

        const isLast = localIndex === filteredTabs.length - 1;

        const targets = {
            self: [tab],
            others: filteredTabs.filter((t) => t.id !== tab.id),
            right: isLast || localIndex === -1 ? [] : filteredTabs.slice(localIndex + 1),
            all: filteredTabs,
        } as const;

        const toClose = targets[type] ?? [];

        toClose.forEach(handler.close);
    };
</script>

{#if handleBefore}<ResizableHandle class={cn(hidden && "hidden")} />{/if}
<ResizablePane defaultSize={size} collapsedSize={0} collapsible class={cn(hidden && "hidden")} bind:this={pane}>
    <div class="flex h-full w-full flex-col">
        <PaneHeader>
            <div
                class={cn("flex flex-row", posTabs.length > 0 || "w-full")}
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
                        onclick={() => updateCurrent(position, tab0)}
                        onclose={(type) => handleClose(type, tab0)}
                    />
                {/each}
            </div>
            <PaneMenu offset {position} {handler}>
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
