<script lang="ts">
    import { ResizablePane, ResizablePaneGroup } from "$lib/components/ui/resizable";
    import type { Entry } from "$lib/workspace";
    import { type Tab, TabPosition } from "$lib/tab";
    import type { LogEntry } from "$lib/log";
    import Pane from "$lib/components/pane/pane.svelte";
    import MainPane from "$lib/components/pane/main.svelte";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";
    import { panePrimaryTop, panePrimaryBottom, paneSecondaryLeft, paneSecondaryRight } from "$lib/state";

    interface Props {
        current: Map<TabPosition, Tab>;
        tabs: Tab[];
        entries: Entry[];
        logEntries: LogEntry[];
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { current = $bindable(), tabs, entries, logEntries, disasms, handler }: Props = $props();
</script>

<ResizablePaneGroup direction="horizontal" class="grow basis-0" autoSaveId="content-horizontal">
    <Pane
        size={20}
        position={TabPosition.SECONDARY_LEFT}
        handleAfter
        hidden={!$paneSecondaryLeft}
        bind:current
        {tabs}
        {handler}
    >
        {#snippet children(tab)}
            <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
        {/snippet}
    </Pane>
    <ResizablePane>
        <ResizablePaneGroup direction="vertical" autoSaveId="content-vertical">
            <Pane
                size={20}
                position={TabPosition.PRIMARY_TOP}
                handleAfter
                hidden={!$panePrimaryTop}
                bind:current
                {tabs}
                {handler}
            >
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <Pane position={TabPosition.PRIMARY_CENTER} bind:current {tabs} {handler}>
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
            <Pane
                size={20}
                position={TabPosition.PRIMARY_BOTTOM}
                handleBefore
                hidden={!$panePrimaryBottom}
                bind:current
                {tabs}
                {handler}
            >
                {#snippet children(tab)}
                    <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
                {/snippet}
            </Pane>
        </ResizablePaneGroup>
    </ResizablePane>
    <Pane
        size={20}
        position={TabPosition.SECONDARY_RIGHT}
        handleBefore
        hidden={!$paneSecondaryRight}
        bind:current
        {tabs}
        {handler}
    >
        {#snippet children(tab)}
            <MainPane {tab} {entries} {logEntries} {disasms} {handler} />
        {/snippet}
    </Pane>
</ResizablePaneGroup>
