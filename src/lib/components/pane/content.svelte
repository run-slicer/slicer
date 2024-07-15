<script lang="ts">
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { TreePane, CodePane, WelcomePane, PaneHeader, PaneHeaderItem } from "$lib/components/pane";
    import { current as entry, entries } from "$lib/workspace";
    import { tabs } from "$lib/tab";

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
        <div class="flex h-full w-full flex-col">
            <PaneHeader>
                {#each $tabs.values() as tab}
                    <PaneHeaderItem
                        name={tab.name}
                        active={tab.active(tab)}
                        icon={tab.icon}
                        closeable={Boolean(tab.close)}
                        on:click={() => tab.open?.(tab)}
                        on:close={() => tab.close?.(tab)}
                    />
                {/each}
            </PaneHeader>
            {#if $entry}
                <CodePane entry={$entry} />
            {:else}
                <WelcomePane />
            {/if}
        </div>
    </ResizablePane>
</ResizablePaneGroup>
