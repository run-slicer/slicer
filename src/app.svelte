<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import Menu from "$lib/components/menu/menu.svelte";
    import Content from "$lib/components/content.svelte";
    import Crumb from "$lib/components/crumb/crumb.svelte";
    import Command from "$lib/components/command.svelte";
    import { Toaster } from "$lib/components/ui/sonner";
    import { current as currentTab, tabs } from "$lib/tab";
    import { classes, entries } from "$lib/workspace";
    import { current as currentEncoding } from "$lib/workspace/encoding";
    import { scripts } from "$lib/script";
    import { entries as logEntries } from "$lib/log";
    import { all as disasms } from "$lib/disasm";
    import { root as rootKey, panes } from "$lib/state";
    import { theme } from "$lib/theme";
    import { tasks } from "$lib/task";
    import { handler } from "$lib/event";
    import { register as registerShortcuts } from "$lib/shortcut";
    import { onMount } from "svelte";
    import { transformers } from "$lib/workspace/analysis/transform";
    import { modals, Modals } from "svelte-modals";
    import { ScriptLoadShareDialog } from "$lib/components/dialog";

    let tabs0 = $derived(Array.from($tabs.values()));
    let entries0 = $derived(Array.from($entries.values()));
    let classes0 = $derived(Array.from($classes.values()));
    let tasks0 = $derived(Array.from($tasks.values()));
    let disasms0 = $derived(Array.from($disasms.values()));
    let transformers0 = $derived(Array.from($transformers.values()));

    onMount(registerShortcuts);

    // ignore default context menu except on double right-clicks
    onMount(() => {
        let lastClick = Date.now();
        const handler = (e: Event) => {
            // at most 500ms between clicks
            if (Date.now() - lastClick > 500) {
                e.preventDefault();
            }
            lastClick = Date.now();
        };

        window.addEventListener("contextmenu", handler);
        return () => window.removeEventListener("contextmenu", handler);
    });

    onMount(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has("url")) {
            // HTTP file share handler
            const fetchUrl = url.searchParams.get("url")!;

            $handler.addRemote(fetchUrl);
        }
        if (url.searchParams.has("script")) {
            // script load share handler
            modals.open(ScriptLoadShareDialog, { url: url.searchParams.get("script")!, handler: $handler });
        }
    });
</script>

<ModeWatcher
    themeStorageKey={`${rootKey}.theme`}
    modeStorageKey={`${rootKey}.mode`}
    themeColors={{
        dark: `${$theme.cssVars.dark.background}`,
        light: `${$theme.cssVars.light.background}`,
    }}
/>
<Toaster position="bottom-right" offset={{ bottom: "2rem", right: "0.5rem" }} richColors closeButton />
<Menu
    bind:panes={$panes}
    tab={$currentTab}
    entries={entries0}
    classes={classes0}
    scripts={$scripts}
    disasms={disasms0}
    transformers={transformers0}
    handler={$handler}
/>
<Content
    panes={$panes}
    tabs={tabs0}
    entries={entries0}
    classes={$classes}
    logEntries={$logEntries}
    disasms={disasms0}
    handler={$handler}
/>
<Crumb tab={$currentTab} tasks={tasks0} encoding={$currentEncoding} handler={$handler} />
<Command entries={entries0} handler={$handler} />
<Modals />
