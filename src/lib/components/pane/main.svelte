<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, TabPosition, TabType } from "$lib/tab";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";
    import type { LogEntry } from "$lib/log";
    import type { Entry } from "$lib/workspace";

    interface Props {
        tab: Tab;
        entries: Entry[];
        logEntries: LogEntry[];
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { tab, entries, logEntries, disasms, handler }: Props = $props();

    let center = $derived(tab.position !== TabPosition.PRIMARY_CENTER);
</script>

{#if tab.type === TabType.PROJECT}
    {#await import("./tree/tree.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Tree }}
        <Tree {entries} {handler} />
    {/await}
{:else if tab.type === TabType.LOGGING}
    {#await import("./logging.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Logging }}
        <Logging entries={logEntries} />
    {/await}
{:else if tab.type === TabType.WELCOME}
    {#await import("./welcome.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Welcome }}
        <Welcome {handler} />
    {/await}
{:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
    {#await import("./code/code.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Code }}
        <Code {tab} {disasms} {handler} />
    {/await}
{:else if tab.type === TabType.FLOW_GRAPH}
    {#await import("./flow/flow.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Flow }}
        <Flow {tab} />
    {/await}
{:else if tab.type === TabType.IMAGE}
    {#await import("./image/image.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Image }}
        <Image {tab} />
    {/await}
{:else if tab.type === TabType.HEAP_DUMP}
    {#await import("./dump/dump.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Dump }}
        <Dump {tab} />
    {/await}
{:else if tab.type === TabType.CLASS}
    {#await import("./class/class.svelte")}
        <Loading value="Loading..." {center} />
    {:then { default: Class }}
        <Class {tab} {handler} />
    {/await}
{/if}
