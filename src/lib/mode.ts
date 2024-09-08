import { ViewMode, viewMode } from "$lib/state";
import { derived } from "svelte/store";

export const distractionFree = derived(viewMode, ($viewMode) => {
    return $viewMode === ViewMode.DISTRACTION_FREE || $viewMode === ViewMode.ZEN;
});

viewMode.subscribe(($viewMode) => {
    if ($viewMode === ViewMode.FULL_SCREEN || $viewMode === ViewMode.ZEN) {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        }
    } else {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
});
