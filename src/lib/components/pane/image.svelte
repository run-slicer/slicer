<script lang="ts">
    import type { Tab } from "$lib/tab";
    import Loading from "$lib/components/loading.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import { tweened } from "svelte/motion";
    import { onDestroy } from "svelte";
    import { humanSize } from "$lib/utils";

    export let tab: Tab;
    let entry = tab.entry!;

    const scale = tweened<number>(1.0, { duration: 125 });
    const rescale = (e: WheelEvent) => {
        $scale = Math.max(
            0.5 /* minimum scale */,
            Math.min(2.0 /* maximum scale */, $scale * (1.0 - e.deltaY / 250) /* smoothing */)
        );
    };

    let elem: HTMLImageElement;
    const createURL = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        onDestroy(() => URL.revokeObjectURL(url));

        return url;
    };
</script>

{#await entry.data.blob()}
    <Loading value="Reading..." overlay />
{:then blob}
    <div class="flex h-8 min-h-8 w-full flex-col">
        <div class="flex grow flex-row items-center justify-end bg-background px-2">
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
            class="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center overflow-hidden"
            on:wheel={rescale}
        >
            <img
                bind:this={elem}
                src={createURL(blob)}
                alt={entry.shortName}
                class="pointer-events-none h-[95%] w-[95%] object-contain will-change-transform"
                style="transform: scale({$scale});"
                on:load={(/* refresh */) => (elem = elem)}
            />
        </div>
    </div>
{/await}
