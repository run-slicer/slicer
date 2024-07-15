<script lang="ts">
    import { Dialog, DialogContent } from "$lib/components/ui/dialog";

    export let open = false;

    let imageId = Math.floor(Math.random() * 4);
    const changeImage = () => {
        imageId++;
        if (imageId > 3) {
            imageId = 0; // wrap around
        }
    };
</script>

<Dialog bind:open>
    <DialogContent class="flex flex-col justify-between">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <a href="https://www.pixiv.net/en/artworks/93602463">
                    <img src={`/assets/fumo/${imageId}.png`} alt="Artwork" title="by horeyearth" />
                </a>
            </div>
            <div>
                <p class="text-2xl">
                    <button class="mr-1 cursor-help font-bold" on:click={changeImage}>slicer</button>
                    {process.env.APP_VERSION}
                </p>
                <p class="text-sm">
                    <!-- this is ugly, but I don't want a space before the comma -->
                    <a
                        href={`https://github.com/run-slicer/slicer/commit/${process.env.APP_COMMIT}`}
                        class="hover:text-blue-500 hover:underline">{process.env.APP_COMMIT}</a
                    >, branch {process.env.APP_BRANCH}
                </p>
                <p class="mt-6 font-mono text-sm">
                    {navigator.userAgent}
                </p>
            </div>
        </div>
        <p class="mt-2 text-center text-sm text-muted-foreground">
            Open-source ❤️
            <span class="mx-2">@</span>
            <a href="https://github.com/run-slicer/slicer" class="hover:text-blue-500 hover:underline">
                run-slicer/slicer
            </a>
        </p>
    </DialogContent>
</Dialog>
