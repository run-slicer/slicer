<script lang="ts">
    import { workers } from "$lib/reader";
    import Loading from "$lib/components/loading.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import { error } from "$lib/log";
    import { FileQuestionMark } from "@lucide/svelte";
    import Table from "./table.svelte";
    import { humanSize } from "$lib/utils";
    import type { PaneProps } from "$lib/components/pane";
    import { t } from "$lib/i18n";
    import { onDestroy } from "svelte";

    let { tab }: PaneProps = $props();
    const entry = $derived(tab.entry!);

    const readTask = $derived(
        workers.instance().cancellable(async (w) => {
            try {
                return w.hprof(await entry.data.blob());
            } catch (e) {
                error("failed to read heap dump", e);

                throw e;
            }
        })
    );

    onDestroy(() => {
        readTask.cancel();
    });
</script>

{#await readTask}
    <Loading value={$t("pane.dump.loading")} timed />
{:then result}
    <div class="flex h-8 min-h-8 w-full flex-col">
        <div class="bg-background flex grow flex-row items-center gap-4 px-2 text-xs">
            <p>
                {$t("pane.dump.timestamp")}
                <span class="text-muted-foreground">{result.timestamp.toLocaleString()}</span>
            </p>
            <p>
                {$t("pane.dump.id-size")}
                <span class="text-muted-foreground">
                    {result.idSize}
                    {$t("pane.dump.id-size.bits", (result.idSize || 0) * 8)}
                </span>
            </p>
            <p>
                {$t("pane.dump.total-size")}
                <span class="text-muted-foreground">
                    {humanSize(result.entries.reduce((acc, v) => acc + v.totalSize, 0))}
                </span>
            </p>
        </div>
        <Separator />
    </div>
    <Table class="h-full min-h-0 w-full p-2" entries={result.entries} />
{:catch e}
    <div class="flex h-full w-full flex-col items-center justify-center">
        <FileQuestionMark class="text-muted-foreground mb-4 animate-bounce" size={128} />
        <p class="mb-1 text-2xl font-semibold">
            {$t("pane.dump.fail.title")}
        </p>
        <p class="text-muted-foreground mb-32 text-sm">
            {$t("pane.dump.fail.subtitle")}
        </p>
        <p class="text-muted-foreground text-xs">{e}</p>
    </div>
{/await}
