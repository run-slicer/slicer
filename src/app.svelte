<script lang="ts">
    import { ModeWatcher, mode } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { ContentPane } from "$lib/components/pane";
    import { Toaster } from "$lib/components/ui/sonner";
    import { register as registerShortcuts } from "$lib/shortcut";

    registerShortcuts();

    $: {
        $mode; // trigger update on mode change

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            const color = window.getComputedStyle(document.body, null).getPropertyValue("--background");
            meta.setAttribute("content", `hsl(${color})`);
        }
    }
</script>

<ModeWatcher />
<Toaster richColors />
<Menu />
<ContentPane />
