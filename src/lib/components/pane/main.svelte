<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, TabType } from "$lib/tab";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";

    interface Props {
        tab: Tab;
        disasms: Disassembler[];
        handler: EventHandler;
    }

    let { tab, disasms, handler }: Props = $props();
</script>

{#if tab.type === TabType.WELCOME}
    {#await import("./welcome.svelte")}
        <Loading value="Loading..." />
    {:then { default: Welcome }}
        <Welcome {handler} />
    {/await}
{:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
    {#await import("./code/code.svelte")}
        <Loading value="Loading..." />
    {:then { default: Code }}
        <Code {tab} {disasms} {handler} />
    {/await}
{:else if tab.type === TabType.FLOW_GRAPH}
    {#await import("./flow/flow.svelte")}
        <Loading value="Loading..." />
    {:then { default: Flow }}
        <Flow {tab} />
    {/await}
{:else if tab.type === TabType.IMAGE}
    {#await import("./image/image.svelte")}
        <Loading value="Loading..." />
    {:then { default: Image }}
        <Image {tab} />
    {/await}
{:else if tab.type === TabType.HEAP_DUMP}
    {#await import("./dump/dump.svelte")}
        <Loading value="Loading..." />
    {:then { default: Dump }}
        <Dump {tab} />
    {/await}
{:else if tab.type === TabType.CLASS}
    {#await import("./class/class.svelte")}
        <Loading value="Loading..." />
    {:then { default: Class }}
        <Class {tab} {handler} />
    {/await}
{/if}
