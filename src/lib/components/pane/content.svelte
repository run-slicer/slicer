<script lang="ts">
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { TreePane, CodePane, WelcomePane } from "$lib/components/pane";
    import { current as entry, entries } from "$lib/workspace";

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
        {#if $entry}
            <CodePane bind:entry={$entry} />
        {:else}
            <WelcomePane />
        {/if}
    </ResizablePane>
</ResizablePaneGroup>
