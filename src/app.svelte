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
    import { theme } from "$lib/theme";
    import { register as registerShortcuts } from "$lib/shortcut";
    import { onMount } from "svelte";

    let tabs0 = $derived(Array.from($tabs.values()));
    let entries0 = $derived(Array.from($entries.values()));
    let disasms0 = $derived(Array.from($disasms.values()));

    onMount(registerShortcuts);
</script>

<ModeWatcher
    themeStorageKey={`${rootKey}.theme`}
    modeStorageKey={`${rootKey}.mode`}
    themeColors={{
        dark: `hsl(${$theme.cssVars.dark.background})`,
        light: `hsl(${$theme.cssVars.light.background})`,
    }}
/>
<Loader />
<Toaster position="top-right" richColors />
<Menu tab={$currentTab} entries={entries0} scripts={$scripts} onaction={handle} />
<Content
    bind:tab={$currentTab}
    tabs={tabs0}
    entries={entries0}
    logentries={$logEntries}
    disasms={disasms0}
    onaction={handle}
/>
<Breadcrumb tab={$currentTab} encoding={$currentEncoding} />
{#await import("$lib/components/command.svelte") then { default: Command }}
    <Command entries={entries0} />
{/await}
