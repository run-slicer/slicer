<script lang="ts">
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane";
    import { Terminal } from "lucide-svelte";
    import type { EditorView } from "@codemirror/view";
    import { loggingOpen } from "$lib/state";
    import { type LogEntry, entries } from "$lib/logging";

    const readEntries = (logs: LogEntry[]): string => {
        let result: string[] = [];
        for (const entry of logs) {
            result.push(`${entry.level}: ${entry.message}`);
        }

        return result.join("\n");
    };

    let view: EditorView;

    let value = readEntries($entries);
    $: {
        value = readEntries($entries);
        if (view) {
            // scroll to the last line automatically
            const lastLine = view.state.doc.line(view.state.doc.lines);

            const { node } = view.domAtPos(lastLine.from);
            node.parentElement?.scrollIntoView({ block: "end" });
        }
    }
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader>
        <PaneHeaderItem
            name="Logging"
            icon={{ icon: Terminal, classes: ["text-muted-foreground"] }}
            closeable
            on:close={() => ($loggingOpen = false)}
        />
    </PaneHeader>
    <div class="relative basis-full overflow-hidden scrollbar-thin">
        {#await Promise.all([import("./code/editor.svelte"), import("./code/lang/log")]) then [editor, { log }]}
            <svelte:component this={editor.default} readonly {value} lang={log()} on:ready={(e) => (view = e.detail)} />
        {/await}
    </div>
</div>
