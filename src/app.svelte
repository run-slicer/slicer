<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import Menu from "$lib/components/menu/menu.svelte";
    import Content from "$lib/components/content.svelte";
    import Crumb from "$lib/components/crumb/crumb.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import { current as currentTab, tabs } from "$lib/tab";
    import { classes, entries } from "$lib/workspace";
    import { current as currentEncoding } from "$lib/workspace/encoding";
    import { scripts } from "$lib/script";
    import { entries as logEntries } from "$lib/log";
    import { all as disasms } from "$lib/disasm";
    import { root as rootKey } from "$lib/state";
    import { handle } from "$lib/action";
    import { theme } from "$lib/theme";
    import { tasks } from "$lib/task";
    import { register as registerShortcuts } from "$lib/shortcut";
    import { onMount } from "svelte";

    let tabs0 = $derived(Array.from($tabs.values()));
    let entries0 = $derived(Array.from($entries.values()));
    let classes0 = $derived(Array.from($classes.values()));
    let tasks0 = $derived(Array.from($tasks.values()));
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
<Toaster position="top-right" richColors />
<Menu tab={$currentTab} entries={entries0} classes={classes0} scripts={$scripts} disasms={disasms0} onaction={handle} />
<Content
    bind:tab={$currentTab}
    tabs={tabs0}
    entries={entries0}
    logentries={$logEntries}
    disasms={disasms0}
    onaction={handle}
/>
<Crumb tab={$currentTab} tasks={tasks0} encoding={$currentEncoding} />
{#await import("$lib/components/command.svelte") then { default: Command }}
    <Command entries={entries0} />
{/await}
