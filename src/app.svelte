<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { type EditorConfig, ContentPane } from "$lib/components/pane";
    import Toaster from "$lib/components/toaster.svelte";
    import { entries, current as entry } from "$lib/workspace";
    import { register as registerShortcuts } from "$lib/shortcut";

    let config: EditorConfig = { view: "text" };
    $: entries0 = Array.from($entries.values());

    registerShortcuts();
</script>

<ModeWatcher />
<Toaster />
<Menu bind:config />
<ContentPane bind:entries={entries0} bind:entry={$entry} bind:config />
