<script lang="ts">
    import { ModeWatcher } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { ContentPane } from "$lib/components/pane";
    import { Toaster } from "$lib/components/ui/sonner";
    import { register as registerShortcuts } from "$lib/shortcut";

    registerShortcuts();
</script>

<ModeWatcher />
<Toaster richColors />
<Menu />
<ContentPane />
