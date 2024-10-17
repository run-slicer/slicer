<script lang="ts">
    import type { Tab } from "$lib/tab";
    import Loading from "$lib/components/loading.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { onDestroy } from "svelte";
    import { humanSize } from "$lib/utils";
    import { Fullscreen, ZoomIn, ZoomOut } from "lucide-svelte";
    import MenuButton from "./menu_button.svelte";

    export let tab: Tab;
    const entry = tab.entry!;

    const normOptions = { duration: 125, easing: cubicOut };

    let offsetX = 0.0;
    const normOffsetX = tweened<number>(offsetX, normOptions);
    $: normOffsetX.set(offsetX);

    let offsetY = 0.0;
    const normOffsetY = tweened<number>(offsetY, normOptions);
    $: normOffsetY.set(offsetY);

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
            offsetX += newCentroid.x - lastCentroid.x;
            offsetY += newCentroid.y - lastCentroid.y;
            lastCentroid = newCentroid;
        }
    };

    const handlePointerUp = (event: PointerEvent) => {
        events.delete(event.pointerId);
        lastCentroid = events.size > 0 ? updatePosition() : null;
    };

    let scale = 1.0;
    const normScale = tweened<number>(scale, normOptions);
    $: normScale.set(scale);

    const rescale = (scaler: (old: number) => number) => {
        const newScale = Math.max(0.5 /* minimum scale */, Math.min(6.0 /* maximum scale */, scaler(scale)));

        // normalize position
        offsetX = (offsetX / scale) * newScale;
        offsetY = (offsetY / scale) * newScale;

        scale = newScale;
    };

    const reset = () => {
        scale = 1.0;
        offsetX = 0.0;
        offsetY = 0.0;
    };

    let elem: HTMLImageElement;
    const createURL = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        onDestroy(() => URL.revokeObjectURL(url));

        return url;
    };
</script>

{#await entry.data.blob()}
    <Loading value="Reading..." />
{:then blob}
    <div class="flex h-8 min-h-8 w-full flex-col">
        <div class="flex grow flex-row items-center justify-between bg-background px-2">
            <div class="flex gap-2">
                <MenuButton icon={Fullscreen} label="Reset" on:click={reset} />
                <MenuButton icon={ZoomIn} label="Zoom in" on:click={() => rescale((s) => s + 0.5)} />
                <MenuButton icon={ZoomOut} label="Zoom out" on:click={() => rescale((s) => s - 0.5)} />
            </div>
            <div class="text-xs">
                {elem?.naturalWidth}x{elem?.naturalHeight}
                {entry.extension?.toUpperCase() || "image"}
                <span class="text-muted-foreground">{humanSize(blob.size)}</span>
            </div>
        </div>
        <Separator />
    </div>
    <div class="relative h-full w-full">
        <div
            class="absolute bottom-0 left-0 right-0 top-0 flex select-none items-center justify-center overflow-hidden"
            on:wheel={(e) => rescale((s) => s * (1.0 - e.deltaY / 250) /* smoothing */)}
            on:pointerup={handlePointerUp}
            on:pointermove={handlePointerMove}
            on:pointerdown={handlePointerDown}
            on:pointercancel={handlePointerUp}
            on:pointerleave={handlePointerUp}
            on:pointerout={handlePointerUp}
        >
            <img
                bind:this={elem}
                src={createURL(blob)}
                alt={entry.shortName}
                class="pointer-events-none h-[95%] w-[95%] object-contain will-change-transform"
                style="transform: translate({$normOffsetX}px, {$normOffsetY}px) scale({$normScale});"
                on:load={(/* refresh */) => (elem = elem)}
            />
        </div>
    </div>
{/await}
