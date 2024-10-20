<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import Loader from "$lib/components/loader.svelte";
    import Menu from "$lib/components/menu/menu.svelte";
    import Content from "$lib/components/content.svelte";
    import Breadcrumb from "$lib/components/breadcrumb.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import { current as currentTab, tabs } from "$lib/tab";
    import { entries } from "$lib/workspace";
    import { current as currentEncoding } from "$lib/workspace/encoding";
    import { scripts } from "$lib/script";
    import { entries as logEntries } from "$lib/log";
    import { all as disasms } from "$lib/disasm";
    import { root as rootKey } from "$lib/state";
    import { handle } from "$lib/action";

    $: entries0 = Array.from($entries.values());
</script>

<ModeWatcher themeStorageKey={`${rootKey}.theme`} modeStorageKey={`${rootKey}.mode`} />
<Loader />
<Toaster position="top-right" richColors />
<Menu tab={$currentTab} entries={entries0} scripts={$scripts} on:action={(e) => handle(e.detail)} />
<Content
    bind:tab={$currentTab}
    tabs={Array.from($tabs.values())}
    entries={entries0}
    logEntries={$logEntries}
    disasms={Array.from($disasms.values())}
    on:action={(e) => handle(e.detail)}
/>
<Breadcrumb tab={$currentTab} encoding={$currentEncoding} />
{#await import("$lib/components/command.svelte") then { default: Command }}
    <Command entries={entries0} />
{/await}
