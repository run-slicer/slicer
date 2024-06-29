<script lang="ts">
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import { TreePane, CodePane, type EditorConfig } from "$lib/components/pane";
    import type { Entry } from "$lib/workspace";

    export let config: EditorConfig;
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
        <CodePane bind:entry bind:config />
    </ResizablePane>
</ResizablePaneGroup>
