<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import type { LogEntry } from "$lib/log";
    import { prettyErrorStack } from "$lib/utils";

    interface Props {
        entries: LogEntry[];
    }

    let { entries }: Props = $props();

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

    let value = $derived(readEntries(entries));
</script>

<div class="relative basis-full overflow-hidden scrollbar-thin">
    {#await Promise.all([import("$lib/components/editor/editor.svelte"), import("$lib/lang/parser/log")])}
        <Loading center />
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
