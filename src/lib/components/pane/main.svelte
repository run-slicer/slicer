<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import { type Tab, TabType } from "$lib/tab";
    import type { Disassembler } from "$lib/disasm";
    import type { ActionHandler } from "$lib/action";

    interface Props {
        tab: Tab;
        flag: any;
        disasms: Disassembler[];
        onaction?: ActionHandler;
    }

    let { tab, flag, disasms, onaction }: Props = $props();
</script>

{#key flag}
    {#if tab.type === TabType.WELCOME}
        {#await import("./welcome.svelte")}
            <Loading value="Loading..." />
        {:then { default: Welcome }}
            <Welcome {onaction} />
        {/await}
    {:else if tab.type === TabType.CODE || tab.type === TabType.HEX}
        {#await import("./code/code.svelte")}
            <Loading value="Loading..." />
        {:then { default: Code }}
            <Code {tab} {disasms} {onaction} />
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
    {/if}
{/key}
