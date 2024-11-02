<svelte:options immutable />

<script lang="ts">
    import Lazy from "$lib/components/lazy.svelte";
    import { type Tab, TabType } from "$lib/tab";
    import type { Disassembler } from "$lib/disasm";

    export let tab: Tab;
    export let dirtyFlag: any;

    export let disasms: Disassembler[];
</script>

{#key dirtyFlag}
    {#if tab.type === TabType.WELCOME}
        <Lazy component={() => import("./welcome.svelte")} on:action />
    {:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
        <Lazy component={() => import("./code/code.svelte")} {tab} {disasms} on:action />
    {:else if tab.type === TabType.FLOW_GRAPH}
        <Lazy component={() => import("./flow/flow.svelte")} {tab} />
    {:else if tab.type === TabType.IMAGE}
        <Lazy component={() => import("./image/image.svelte")} {tab} />
    {:else if tab.type === TabType.HEAP_DUMP}
        <Lazy component={() => import("./dump/dump.svelte")} {tab} />
    {/if}
{/key}
