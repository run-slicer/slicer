<script lang="ts">
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { TreePane, CodePane } from "$lib/components/pane";
    import type { Entry } from "$lib/workspace";

    export let entries: Entry[];
    export let entry: Entry | null = null;

    export let layoutId = "content-pane";
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0" autoSaveId={layoutId}>
    <ResizablePane defaultSize={20}>
        <TreePane bind:entries />
    </ResizablePane>
    <ResizableHandle />
    <ResizablePane>
        <CodePane bind:entry />
    </ResizablePane>
</ResizablePaneGroup>
