<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { entries } from "$lib/workspace";
    import { current, orderedTabs, remove, TabType } from "$lib/tab";
    import { projectOpen, loggingOpen } from "$lib/state";
    import { cn } from "$lib/utils";
    import {
        TreePane,
        CodePane,
        FlowPane,
        WelcomePane,
        LoggingPane,
        PaneHeader,
        PaneHeaderItem,
    } from "$lib/components/pane";

    export let layoutId = "content-pane";

    $: entries0 = Array.from($entries.values());
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0" autoSaveId={layoutId}>
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
                    {#key $current}
                        {#if $current}
                            {#if $current.type === TabType.WELCOME}
                                <WelcomePane />
                            {:else if $current.type === TabType.CODE && $current.entry}
                                <CodePane entry={$current.entry} />
                            {:else if $current.type === TabType.FLOW_GRAPH && $current.entry}
                                <FlowPane entry={$current.entry} member={$current.member || null} />
                            {/if}
                        {/if}
                    {/key}
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
