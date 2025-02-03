<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import type { LogEntry } from "$lib/log";
    import { prettyErrorStack } from "$lib/utils";
    import type { PaneProps } from "$lib/components/pane";

    let { logEntries }: PaneProps = $props();

    const readEntries = (logs: LogEntry[]): string => {
        let result: string[] = [];
        for (const entry of logs) {
            result.push(`${entry.level}: ${entry.message}`);

            const stack = prettyErrorStack(entry.error);
            if (stack) {
                result.push(stack);
            }
        }

        return result.join("\n");
    };

    let value = $derived(readEntries(logEntries));
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([import("$lib/components/editor/editor.svelte"), import("@codemirror/view"), import("$lib/lang/parser/log")])}
        <Loading center />
    {:then [{ default: CodeEditor }, { EditorView }, { log }]}
        <CodeEditor
            wrap
            readonly
            {value}
            lang={log()}
            onchange={(view) => {
                // scroll to the last line automatically
                const lastLine = view.state.doc.line(view.state.doc.lines);
                view.dispatch({ effects: [EditorView.scrollIntoView(lastLine.from)] });
            }}
        />
    {/await}
</div>
