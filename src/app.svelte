<script lang="ts">
    import { ModeWatcher, mode } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { ContentPane } from "$lib/components/pane";
    import { Toaster } from "$lib/components/ui/sonner";
    import Breadcrumb from "$lib/components/breadcrumb.svelte";
    import { onMount } from "svelte";
    import { current as currentTab, tabs } from "$lib/tab";
    import { entries } from "$lib/workspace";
    import { scripts } from "$lib/script";
    import { entries as logEntries } from "$lib/log";
    import { all as disasms } from "$lib/disasm";
    import { root as rootKey } from "$lib/state";
    import { handle } from "$lib/action";

    onMount(() => {
        mode.subscribe(() => {
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                const color = window.getComputedStyle(document.body, null).getPropertyValue("--background");
                (meta as HTMLMetaElement).content = `hsl(${color})`;
            }
        });
    });
</script>

<ModeWatcher themeStorageKey={`${rootKey}.theme`} modeStorageKey={`${rootKey}.mode`} />
<Toaster position="top-right" richColors />
<Menu
    tab={$currentTab}
    entries={Array.from($entries.values())}
    scripts={$scripts}
    on:action={(e) => handle(e.detail)}
/>
<ContentPane
    bind:tab={$currentTab}
    tabs={Array.from($tabs.values())}
    entries={Array.from($entries.values())}
    logEntries={$logEntries}
    disasms={Array.from($disasms.values())}
    on:action={(e) => handle(e.detail)}
/>
<Breadcrumb tab={$currentTab} />
