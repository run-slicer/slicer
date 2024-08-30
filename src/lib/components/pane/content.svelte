<script lang="ts" context="module">
    import { writable } from "svelte/store";
    import { type Tab, tabs } from "$lib/tab";

    export const orderedTabs = writable<Tab[]>([]);

    // synchronize stores - order is kept only here, main store is unordered
    tabs.subscribe((tabs0) => {
        orderedTabs.update((orderedTabs0) => {
            // pop removed tabs
            const updatedTabs = orderedTabs0.filter((e) => tabs0.has(e.id));
            // now add newly added tabs
            updatedTabs.push(...Array.from(tabs0.values()).filter((e) => !orderedTabs0.includes(e)));

            return updatedTabs;
        });
    });
</script>

<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { entries } from "$lib/workspace";
    import { current, checkDirty, remove } from "$lib/tab";
    import { projectOpen, loggingOpen } from "$lib/state";
    import { cn } from "$lib/components/utils";
    import { TreePane, LoggingPane, PaneHeader, PaneHeaderItem, EditorPane } from "$lib/components/pane";

    $: entries0 = Array.from($entries.values());
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0">
    <!-- only hide the project pane, because we don't actually want to force a re-render of the tree -->
    <ResizablePane defaultSize={20} class={cn($projectOpen || "hidden")}>
        <TreePane bind:entries={entries0} />
    </ResizablePane>
    <ResizableHandle class={cn($projectOpen || "hidden")} />
    <ResizablePane>
        <ResizablePaneGroup direction="vertical">
            <ResizablePane>
                <div class="flex h-full w-full flex-col">
                    <PaneHeader>
                        <div
                            class="flex w-full"
                            use:dndzone={{
                                items: $orderedTabs,
                                dropFromOthersDisabled: true,
                                dropTargetStyle: {},
                            }}
                            on:consider={(e) => ($orderedTabs = e.detail.items)}
                            on:finalize={(e) => ($orderedTabs = e.detail.items)}
                        >
                            {#each $orderedTabs as tab (tab.id)}
                                <PaneHeaderItem
                                    name={tab.name}
                                    active={$current?.id === tab.id}
                                    icon={tab.icon}
                                    closeable
                                    on:click={() => ($current = tab)}
                                    on:close={() => remove(tab.id)}
                                />
                            {/each}
                        </div>
                    </PaneHeader>
                    {#each $tabs as [id, tab] (id)}
                        <div class={cn("flex h-full w-full flex-col", $current?.id === id || "hidden")}>
                            <EditorPane {tab} dirtyFlag={checkDirty(tab, $current)} />
                        </div>
                    {/each}
                </div>
            </ResizablePane>
            {#if $loggingOpen}
                <ResizableHandle />
                <ResizablePane defaultSize={20}>
                    <LoggingPane />
                </ResizablePane>
            {/if}
        </ResizablePaneGroup>
    </ResizablePane>
</ResizablePaneGroup>
