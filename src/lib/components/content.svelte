<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { createEventDispatcher } from "svelte";
    import { writable } from "svelte/store";
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import type { Entry } from "$lib/workspace";
    import { type Tab, checkDirty } from "$lib/tab";
    import { projectOpen, loggingOpen } from "$lib/state";
    import { distractionFree } from "$lib/mode";
    import { ActionType } from "$lib/action";
    import type { LogEntry } from "$lib/log";
    import { cn } from "$lib/components/utils";
    import TreePane from "$lib/components/pane/tree/tree.svelte";
    import LoggingPane from "$lib/components/pane/logging.svelte";
    import MainPane from "$lib/components/pane/main.svelte";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import type { Disassembler } from "$lib/disasm";

    export let tab: Tab | null;
    export let tabs: Tab[];

    // order is kept only here, main store is unordered
    const orderedTabs = writable(tabs);
    $: {
        orderedTabs.update((orderedTabs0) => {
            // pop removed tabs
            const updatedTabs = orderedTabs0.filter((e) => tabs.includes(e));
            // now add newly added tabs
            updatedTabs.push(...tabs.filter((e) => !orderedTabs0.includes(e)));

            return updatedTabs;
        });
    }

    export let entries: Entry[];
    export let logEntries: LogEntry[];

    export let disasms: Disassembler[];

    const dispatch = createEventDispatcher();
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0">
    <!-- only hide the project pane, because we don't actually want to force a re-render of the tree -->
    <ResizablePane defaultSize={20} class={cn(($projectOpen && !$distractionFree) || "hidden")}>
        <TreePane {entries} on:action />
    </ResizablePane>
    <ResizableHandle class={cn(($projectOpen && !$distractionFree) || "hidden")} />
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
                            {#each $orderedTabs as tab0 (tab0.id)}
                                <PaneHeaderItem
                                    name={tab0.name}
                                    active={tab?.id === tab0.id}
                                    icon={tab0.icon}
                                    closeable
                                    on:click={() => (tab = tab0)}
                                    on:close={() => dispatch("action", { type: ActionType.CLOSE, tab: tab0 })}
                                />
                            {/each}
                        </div>
                    </PaneHeader>
                    {#each tabs as tab0 (tab0.id)}
                        <div
                            class={cn("relative flex h-full min-h-0 w-full flex-col", tab?.id === tab0.id || "hidden")}
                        >
                            <MainPane tab={tab0} dirtyFlag={checkDirty(tab0, tab)} {disasms} on:action />
                        </div>
                    {/each}
                </div>
            </ResizablePane>
            {#if $loggingOpen && !$distractionFree}
                <ResizableHandle />
                <ResizablePane defaultSize={20}>
                    <LoggingPane entries={logEntries} />
                </ResizablePane>
            {/if}
        </ResizablePaneGroup>
    </ResizablePane>
</ResizablePaneGroup>
