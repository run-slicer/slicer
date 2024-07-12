<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { ContentPane } from "$lib/components/pane";
    import Toaster from "$lib/components/toaster.svelte";
    import { register as registerShortcuts } from "$lib/shortcut";

    registerShortcuts();
</script>

<ModeWatcher />
<Toaster />
<Menu />
<ContentPane />
