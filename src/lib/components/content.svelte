<script lang="ts">
    import { ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import type { Entry } from "$lib/workspace";
    import { type Tab, TabPosition } from "$lib/tab";
    import type { LogEntry } from "$lib/log";
    import { Pane, RootPane } from "$lib/components/pane";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";
    import type { PaneData } from "$lib/state";

    interface Props {
        panes: PaneData[];
        tabs: Tab[];
        entries: Entry[];
        logEntries: LogEntry[];
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { panes, tabs, entries, logEntries, disasms, handler }: Props = $props();

    let primaryBottom = $derived(panes.find((p) => p.position === TabPosition.PRIMARY_BOTTOM));
    let secondaryLeft = $derived(panes.find((p) => p.position === TabPosition.SECONDARY_LEFT));
    let secondaryRight = $derived(panes.find((p) => p.position === TabPosition.SECONDARY_RIGHT));
</script>

<ResizablePaneGroup direction="vertical" class="grow basis-0" autoSaveId="content-vertical">
    <ResizablePane>
        <ResizablePaneGroup direction="horizontal" class="grow basis-0" autoSaveId="content-horizontal">
            <Pane
                size={20}
                position={TabPosition.SECONDARY_LEFT}
                handleAfter
                hidden={!secondaryLeft?.open}
                {tabs}
                {handler}
            >
                {#snippet children(tab)}
                    <RootPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <Pane position={TabPosition.PRIMARY_CENTER} {tabs} {handler}>
                {#snippet children(tab)}
                    <RootPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <Pane
                size={20}
                position={TabPosition.SECONDARY_RIGHT}
                handleBefore
                hidden={!secondaryRight?.open}
                {tabs}
                {handler}
            >
                {#snippet children(tab)}
                    <RootPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
        </ResizablePaneGroup>
    </ResizablePane>
    <Pane size={30} position={TabPosition.PRIMARY_BOTTOM} handleBefore hidden={!primaryBottom?.open} {tabs} {handler}>
        {#snippet children(tab)}
            <RootPane {tab} {entries} {logEntries} {disasms} {handler} />
        {/snippet}
    </Pane>
</ResizablePaneGroup>
