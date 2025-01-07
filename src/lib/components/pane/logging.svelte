<script lang="ts">
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import Loading from "$lib/components/loading.svelte";
    import { Terminal } from "lucide-svelte";
    import type { LogEntry } from "$lib/log";

    interface Props {
        entries: LogEntry[];
    }

    let { entries }: Props = $props();

    const readEntries = (logs: LogEntry[]): string => {
        let result: string[] = [];
        for (const entry of logs) {
            result.push(`${entry.level}: ${entry.message}`);
        }

        return result.join("\n");
    };

    let value = $derived(readEntries(entries));
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader>
        <PaneHeaderItem name="Logging" icon={{ icon: Terminal, classes: ["text-muted-foreground"] }} />
    </PaneHeader>
    <div class="relative basis-full overflow-hidden scrollbar-thin">
        {#await Promise.all([import("$lib/components/editor/editor.svelte"), import("$lib/lang/parser/log")])}
            <Loading small />
        {:then [{ default: CodeEditor }, { log }]}
            <CodeEditor
                wrap
                readonly
                {value}
                lang={log()}
                onchange={(view, state) => {
                    // scroll to the last line automatically
                    const lastLine = state.doc.line(state.doc.lines);

                    const { node } = view.domAtPos(lastLine.from);
                    node.parentElement?.scrollIntoView({ block: "end" });
                }}
            />
        {/await}
    </div>
</div>
