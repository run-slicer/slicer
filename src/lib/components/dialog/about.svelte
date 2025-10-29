<script lang="ts">
    import { Dialog, DialogContent } from "$lib/components/ui/dialog";
    import type { ModalProps } from "svelte-modals";
    import { t } from "$lib/i18n";

    let { isOpen, close }: ModalProps = $props();

    let imageId = $state(Math.floor(Math.random() * 4));
    const changeImage = () => {
        imageId++;
        if (imageId > 3) {
            imageId = 0; // wrap around
        }
    };
</script>

<Dialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <DialogContent class="flex flex-col justify-between">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <a href="https://www.pixiv.net/en/artworks/93602463">
                    <img src={`/assets/fumo/${imageId}.png`} alt="Artwork" title="by horeyearth" />
                </a>
            </div>
            <div>
                <p class="text-2xl">
                    <button class="mr-1 cursor-help font-semibold" onclick={changeImage}>
                        {$t("dialog.about.brand")}
                    </button>
                </p>
                <p class="text-sm">
                    {#if import.meta.env.DEV}
                        {$t("dialog.about.build.dev")}
                    {:else}
                        {@const commit = import.meta.env.WORKERS_CI_COMMIT_SHA || "0".repeat(40)}
                        <!-- this is ugly, but I don't want a space before the comma -->
                        <a
                            href={`https://github.com/run-slicer/slicer/commit/${commit}`}
                            target="_blank"
                            class="hover:text-blue-700 hover:underline">{commit.substring(0, 7)}</a
                        >{$t("dialog.about.build.branch", import.meta.env.WORKERS_CI_BRANCH || "unknown")}
                    {/if}
                </p>
                <p class="mt-6 font-mono text-sm">
                    {navigator.userAgent}
                </p>
            </div>
        </div>
        <p class="text-muted-foreground mt-2 text-center text-sm">
            {@html $t("dialog.about.footer")}
        </p>
    </DialogContent>
</Dialog>
