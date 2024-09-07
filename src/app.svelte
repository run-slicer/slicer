<script lang="ts">
    import { ModeWatcher, mode } from "mode-watcher";
    import { Menu } from "$lib/components/menu";
    import { ContentPane } from "$lib/components/pane";
    import { Toaster } from "$lib/components/ui/sonner";
    import Breadcrumb from "$lib/components/breadcrumb.svelte";
    import { onMount } from "svelte";
    import { root as rootKey } from "$lib/state";

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
<Menu />
<ContentPane />
<Breadcrumb />
