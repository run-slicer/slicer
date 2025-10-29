<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import { Tween } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { onDestroy } from "svelte";
    import { humanSize } from "$lib/utils";
    import { Fullscreen, ZoomIn, ZoomOut } from "@lucide/svelte";
    import MenuButton from "./menu_button.svelte";
    import type { PaneProps } from "$lib/components/pane";
    import { t } from "$lib/i18n";

    let { tab }: PaneProps = $props();
    const entry = $derived(tab.entry!);

    const normOptions = { duration: 125, easing: cubicOut };

    const offsetX = new Tween(0.0, normOptions);
    const offsetY = new Tween(0.0, normOptions);

    interface Centroid {
        x: number;
        y: number;
    }

    const events = new Map<number, PointerEvent>();
    const updatePosition = (): Centroid | null => {
        const points = Array.from(events.values());
        if (points.length === 0) {
            return null;
        }

        const sum = points.reduce(
            (acc, { clientX, clientY }) => ({
                x: acc.x + clientX,
                y: acc.y + clientY,
            }),
            { x: 0, y: 0 }
        );

        return {
            x: sum.x / points.length,
            y: sum.y / points.length,
        };
    };

    let lastCentroid: Centroid | null = null;
    const handlePointerDown = (event: PointerEvent) => {
        events.set(event.pointerId, event);
        lastCentroid = updatePosition();
    };

    const handlePointerMove = (event: PointerEvent) => {
        if (!lastCentroid) {
            return;
        }

        events.set(event.pointerId, event);

        const newCentroid = updatePosition();
        if (newCentroid) {
            offsetX.target += newCentroid.x - lastCentroid.x;
            offsetY.target += newCentroid.y - lastCentroid.y;
            lastCentroid = newCentroid;
        }
    };

    const handlePointerUp = (event: PointerEvent) => {
        events.delete(event.pointerId);
        lastCentroid = events.size > 0 ? updatePosition() : null;
    };

    const scale = new Tween(1.0, normOptions);
    const rescale = (scaler: (old: number) => number) => {
        const newScale = Math.max(0.5 /* minimum scale */, Math.min(6.0 /* maximum scale */, scaler(scale.target)));

        // normalize position
        offsetX.target = (offsetX.target / scale.target) * newScale;
        offsetY.target = (offsetY.target / scale.target) * newScale;

        scale.target = newScale;
    };

    const reset = () => {
        scale.target = 1.0;
        offsetX.target = 0.0;
        offsetY.target = 0.0;
    };

    let elem: HTMLImageElement | undefined = $state();
    const handleLoad = (e: Event) => {
        elem = e.target as HTMLImageElement;
    };

    const createURL = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        onDestroy(() => URL.revokeObjectURL(url));

        return url;
    };
</script>

{#await entry.data.blob()}
    <Loading value={$t("pane.image.loading")} timed />
{:then blob}
    <div class="flex h-8 min-h-8 w-full flex-col">
        <div class="bg-background flex grow flex-row items-center justify-between px-2">
            <div class="flex gap-2">
                <MenuButton icon={Fullscreen} label={$t("pane.image.zoom.reset")} onclick={reset} />
                <MenuButton icon={ZoomIn} label={$t("pane.image.zoom.in")} onclick={() => rescale((s) => s + 0.5)} />
                <MenuButton icon={ZoomOut} label={$t("pane.image.zoom.out")} onclick={() => rescale((s) => s - 0.5)} />
            </div>
            <div class="text-xs">
                {elem?.naturalWidth || 0}x{elem?.naturalHeight || 0}
                {entry.extension?.toUpperCase() || "image"}
                <span class="text-muted-foreground">{humanSize(blob.size)}</span>
            </div>
        </div>
        <Separator />
    </div>
    <div class="relative h-full w-full">
        <div
            class="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center overflow-hidden select-none"
            onwheel={(e) => rescale((s) => s * (1.0 - e.deltaY / 250) /* smoothing */)}
            onpointerup={handlePointerUp}
            onpointermove={handlePointerMove}
            onpointerdown={handlePointerDown}
            onpointercancel={handlePointerUp}
            onpointerleave={handlePointerUp}
            onpointerout={handlePointerUp}
        >
            <img
                src={createURL(blob)}
                alt={entry.shortName}
                class="pointer-events-none h-[95%] w-[95%] object-contain will-change-transform"
                style="transform: translate({offsetX.current}px, {offsetY.current}px) scale({scale.current});"
                onload={handleLoad}
            />
        </div>
    </div>
{/await}
