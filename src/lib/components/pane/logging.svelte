<script lang="ts">
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import { Terminal } from "lucide-svelte";
    import type { LogEntry } from "$lib/log";

    export let entries: LogEntry[];

    const readEntries = (logs: LogEntry[]): string => {
        let result: string[] = [];
        for (const entry of logs) {
            result.push(`${entry.level}: ${entry.message}`);
        }

        return result.join("\n");
    };

    $: value = readEntries(entries);
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader>
        <PaneHeaderItem name="Logging" icon={{ icon: Terminal, classes: ["text-muted-foreground"] }} />
    </PaneHeader>
    <div class="relative basis-full overflow-hidden scrollbar-thin">
        {#await Promise.all( [import("$lib/components/editor"), import("$lib/lang/parser/log")] ) then [{ CodeEditor }, { log }]}
            <CodeEditor
                readOnly
                {value}
                lang={log()}
                on:change={(e) => {
                    // scroll to the last line automatically
                    const lastLine = e.detail.state.doc.line(e.detail.state.doc.lines);

                    const { node } = e.detail.view.domAtPos(lastLine.from);
                    node.parentElement?.scrollIntoView({ block: "end" });
                }}
            />
        {/await}
    </div>
</div>
