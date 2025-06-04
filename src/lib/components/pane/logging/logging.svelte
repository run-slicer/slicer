<script lang="ts">
    import type { LogEntry } from "$lib/log";
    import { prettyError, prettyErrorStack } from "$lib/utils";
    import type { PaneProps } from "$lib/components/pane";
    import CodeEditor from "$lib/components/editor/editor.svelte";
    import { log } from "$lib/lang/parser/log";
    import { EditorView } from "@codemirror/view";

    let { logEntries }: PaneProps = $props();

    const readEntries = (logs: LogEntry[]): string => {
        let result: string[] = [];
        for (const entry of logs) {
            result.push(`${entry.level}: ${entry.message}`);

            const stack = prettyErrorStack(entry.error);
            if (stack) {
                result.push(stack);
            }
            const cause = (entry.error as Error)?.cause;
            if (cause) {
                result.push(`Caused by: ${prettyError(cause)}`.replaceAll(/^/gm, "  "));
            }
        }

        return result.join("\n");
    };

    let value = $derived(readEntries(logEntries));
</script>

<div class="scrollbar-thin relative basis-full overflow-hidden">
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
</div>
