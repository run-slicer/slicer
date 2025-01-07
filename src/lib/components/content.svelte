<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { writable } from "svelte/store";
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import type { Entry } from "$lib/workspace";
    import { type Tab, updateCurrent } from "$lib/tab";
    import { loggingOpen, projectOpen } from "$lib/state";
    import type { LogEntry } from "$lib/log";
    import { cn } from "$lib/components/utils";
    import TreePane from "$lib/components/pane/tree/tree.svelte";
    import LoggingPane from "$lib/components/pane/logging.svelte";
    import MainPane from "$lib/components/pane/main.svelte";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";

    interface Props {
        tab: Tab | null;
        tabs: Tab[];
        entries: Entry[];
        logentries: LogEntry[];
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { tab = $bindable(), tabs, entries, logentries, disasms, handler }: Props = $props();

    // order is kept only here, main store is unordered
    const orderedTabs = writable(tabs);
    $effect(() => {
        orderedTabs.update((orderedTabs0) => {
            // pop removed tabs
            const updatedTabs = orderedTabs0.filter((a) => tabs.some((b) => a.id === b.id));
            // now add newly added tabs
            updatedTabs.push(...tabs.filter((b) => !orderedTabs0.some((a) => a.id === b.id)));

            return updatedTabs;
        });
    });
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0">
    <!-- only hide the project pane, because we don't actually want to force a re-render of the tree -->
    <ResizablePane defaultSize={20} class={cn($projectOpen || "hidden")}>
        <TreePane {entries} {handler} />
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
                            onconsider={(e) => ($orderedTabs = e.detail.items)}
                            onfinalize={(e) => ($orderedTabs = e.detail.items)}
                        >
                            {#each $orderedTabs as tab0 (tab0.id)}
                                <PaneHeaderItem
                                    name={tab0.name}
                                    active={tab?.id === tab0.id}
                                    icon={tab0.icon}
                                    closeable
                                    onclick={() => updateCurrent(tab0)}
                                    onclose={() => handler.close(tab0)}
                                />
                            {/each}
                        </div>
                    </PaneHeader>
                    {#each tabs as tab0 (tab0.internalId)}
                        <div
                            class={cn("relative flex h-full min-h-0 w-full flex-col", tab?.id === tab0.id || "hidden")}
                        >
                            <MainPane tab={tab0} {disasms} {handler} />
                        </div>
                    {/each}
                </div>
            </ResizablePane>
            {#if $loggingOpen}
                <ResizableHandle />
                <ResizablePane defaultSize={20}>
                    <LoggingPane entries={logentries} />
                </ResizablePane>
            {/if}
        </ResizablePaneGroup>
    </ResizablePane>
</ResizablePaneGroup>
