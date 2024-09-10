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
        <Lazy component={() => import("./welcome.svelte")} />
    {:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
        <Lazy component={() => import("./code/code.svelte")} {tab} {disasms} />
    {:else if tab.type === TabType.FLOW_GRAPH}
        <Lazy component={() => import("./flow/flow.svelte")} {tab} />
    {/if}
{/key}
