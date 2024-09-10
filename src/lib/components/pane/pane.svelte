<svelte:options immutable />

<script lang="ts">
    import { type Tab, TabType } from "$lib/tab";
    import { CodePane, FlowPane, WelcomePane } from "$lib/components/pane";
    import type { Disassembler } from "$lib/disasm";

    export let tab: Tab;
    export let dirtyFlag: any;

    export let disasms: Disassembler[];
</script>

{#key dirtyFlag}
    {#if tab.type === TabType.WELCOME}
        <WelcomePane />
    {:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
        <CodePane {tab} {disasms} />
    {:else if tab.type === TabType.FLOW_GRAPH}
        <FlowPane {tab} />
    {/if}
{/key}
