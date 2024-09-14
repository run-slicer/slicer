<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import Menu from "$lib/components/menu/menu.svelte";
    import Content from "$lib/components/content.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import Breadcrumb from "$lib/components/breadcrumb.svelte";
    import { current as currentTab, tabs } from "$lib/tab";
    import { entries } from "$lib/workspace";
    import { scripts } from "$lib/script";
    import { entries as logEntries } from "$lib/log";
    import { all as disasms } from "$lib/disasm";
    import { root as rootKey } from "$lib/state";
    import { handle } from "$lib/action";
</script>

<ModeWatcher themeStorageKey={`${rootKey}.theme`} modeStorageKey={`${rootKey}.mode`} />
<Toaster position="top-right" richColors />
<Menu
    tab={$currentTab}
    entries={Array.from($entries.values())}
    scripts={$scripts}
    on:action={(e) => handle(e.detail)}
/>
<Content
    bind:tab={$currentTab}
    tabs={Array.from($tabs.values())}
    entries={Array.from($entries.values())}
    logEntries={$logEntries}
    disasms={Array.from($disasms.values())}
    on:action={(e) => handle(e.detail)}
/>
<Breadcrumb tab={$currentTab} />
