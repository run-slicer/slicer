<script lang="ts">
    import { ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import type { Entry } from "$lib/workspace";
    import { type Tab, TabPosition } from "$lib/tab";
    import type { LogEntry } from "$lib/log";
    import Pane from "$lib/components/pane/pane.svelte";
    import MainPane from "$lib/components/pane/main.svelte";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";
    import { panePrimaryBottom, paneSecondaryLeft, paneSecondaryRight } from "$lib/state";

    interface Props {
        tabs: Tab[];
        entries: Entry[];
        logEntries: LogEntry[];
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { tabs, entries, logEntries, disasms, handler }: Props = $props();
</script>

<ResizablePaneGroup direction="vertical" class="grow basis-0" autoSaveId="content-vertical">
    <ResizablePane>
        <ResizablePaneGroup direction="horizontal" class="grow basis-0" autoSaveId="content-horizontal">
            <Pane
                size={20}
                position={TabPosition.SECONDARY_LEFT}
                handleAfter
                hidden={!$paneSecondaryLeft}
                {tabs}
                {handler}
            >
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <Pane position={TabPosition.PRIMARY_CENTER} {tabs} {handler}>
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <Pane
                size={20}
                position={TabPosition.SECONDARY_RIGHT}
                handleBefore
                hidden={!$paneSecondaryRight}
                {tabs}
                {handler}
            >
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
        </ResizablePaneGroup>
    </ResizablePane>
    <Pane size={20} position={TabPosition.PRIMARY_BOTTOM} handleBefore hidden={!$panePrimaryBottom} {tabs} {handler}>
        {#snippet children(tab)}
            <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
        {/snippet}
    </Pane>
</ResizablePaneGroup>
