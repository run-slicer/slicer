<script lang="ts" context="module">
    import { type Tab, tabs as tabsMap } from "$lib/tab";
    import { writableDerived } from "$lib/store";

    export const tabs = writableDerived<Map<string, Tab>, Tab[]>(
        tabsMap,
        (m) => Array.from(m.values()),
        (a) => new Map(a.map((e) => [e.id, e]))
    );
</script>

<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { TreePane, CodePane, WelcomePane, LoggingPane, PaneHeader, PaneHeaderItem } from "$lib/components/pane";
    import { current as entry, entries } from "$lib/workspace";
    import { loggingOpen } from "$lib/state";

    export let layoutId = "content-pane";

    $: entries0 = Array.from($entries.values());
    $: document.title = $entry ? `slicer - ${$entry.data.shortName}` : "slicer";
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0" autoSaveId={layoutId}>
    <ResizablePane defaultSize={20}>
        <TreePane bind:entries={entries0} />
    </ResizablePane>
    <ResizableHandle />
    <ResizablePane>
        <ResizablePaneGroup direction="vertical">
            <ResizablePane>
                <div class="flex h-full w-full flex-col">
                    <PaneHeader>
                        <div
                            class="flex w-full"
                            use:dndzone={{
                                items: $tabs,
                                dropFromOthersDisabled: true,
                                dropTargetStyle: {},
                            }}
                            on:consider={(e) => ($tabs = e.detail.items)}
                            on:finalize={(e) => ($tabs = e.detail.items)}
                        >
                            {#each $tabs as tab (tab.id)}
                                <PaneHeaderItem
                                    name={tab.name}
                                    active={tab.active(tab)}
                                    icon={tab.icon}
                                    closeable={Boolean(tab.close)}
                                    on:click={() => tab.open?.(tab)}
                                    on:close={() => tab.close?.(tab)}
                                />
                            {/each}
                        </div>
                    </PaneHeader>
                    {#if $entry}
                        <CodePane entry={$entry} />
                    {:else}
                        <WelcomePane />
                    {/if}
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
