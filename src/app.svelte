<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { ContentPane } from "$lib/components/pane";
    import Toaster from "$lib/components/toaster.svelte";
    import { entries, current as entry } from "$lib/workspace";

    $: entries0 = Array.from($entries.values());
</script>

<ModeWatcher />
<Toaster />
<Menu />
<ContentPane bind:entries={entries0} bind:entry={$entry} />
