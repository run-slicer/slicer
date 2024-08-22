<svelte:options immutable />

<script lang="ts">
    import { type Tab, TabType } from "$lib/tab";
    import { CodePane, FlowPane, WelcomePane } from "$lib/components/pane";

    export let tab: Tab;
    export let dirtyFlag: any;
</script>

{#key dirtyFlag}
    {#if tab.type === TabType.WELCOME}
        <WelcomePane />
    {:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
        <CodePane {tab} />
    {:else if tab.type === TabType.FLOW_GRAPH}
        <FlowPane {tab} />
    {/if}
{/key}
