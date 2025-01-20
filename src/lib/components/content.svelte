<script lang="ts">
    import { ResizableHandle, ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import type { Entry } from "$lib/workspace";
    import { type Tab, TabPosition } from "$lib/tab";
    import type { LogEntry } from "$lib/log";
    import Pane from "$lib/components/pane/pane.svelte";
    import MainPane from "$lib/components/pane/main.svelte";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";

    interface Props {
        current: Record<TabPosition, Tab | null>;
        tabs: Tab[];
        entries: Entry[];
        logEntries: LogEntry[];
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { current = $bindable(), tabs, entries, logEntries, disasms, handler }: Props = $props();
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0">
    <Pane size={20} position={TabPosition.SECONDARY_LEFT} bind:current {tabs} {handler}>
        {#snippet children(tab)}
            <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
        {/snippet}
    </Pane>
    <ResizableHandle />
    <ResizablePane>
        <ResizablePaneGroup direction="vertical">
            <Pane size={0} position={TabPosition.PRIMARY_TOP} bind:current {tabs} {handler}>
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <ResizableHandle />
            <Pane position={TabPosition.PRIMARY_CENTER} bind:current {tabs} {handler}>
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <ResizableHandle />
            <Pane size={0} position={TabPosition.PRIMARY_BOTTOM} bind:current {tabs} {handler}>
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
        </ResizablePaneGroup>
    </ResizablePane>
    <ResizableHandle />
    <Pane size={0} position={TabPosition.SECONDARY_RIGHT} bind:current {tabs} {handler}>
        {#snippet children(tab)}
            <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
        {/snippet}
    </Pane>
</ResizablePaneGroup>
