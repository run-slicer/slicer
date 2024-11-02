<script lang="ts">
    import { worker } from "$lib/hprof";
    import type { SlurpResult } from "$lib/hprof/reader";
    import Loading from "$lib/components/loading.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import type { Tab } from "$lib/tab";
    import type { Entry } from "$lib/workspace";
    import { error } from "$lib/log";
    import { FileQuestion } from "lucide-svelte";
    import Table from "./table.svelte";
    import { readable } from "svelte/store";
    import { humanSize } from "$lib/utils";

    export let tab: Tab;
    const entry = tab.entry!;

    const readEntry = async (entry: Entry): Promise<SlurpResult> => {
        try {
            return worker.read(await entry.data.blob());
        } catch (e) {
            error("failed to read heap dump", e);

            throw e;
        }
    };
</script>

{#await readEntry(entry)}
    <Loading value="Reading..." />
{:then result}
    <div class="flex h-8 min-h-8 w-full flex-col">
        <div class="flex grow flex-row items-center gap-4 bg-background px-2 text-xs">
            <p>timestamp: <span class="text-muted-foreground">{result.timestamp.toLocaleString()}</span></p>
            <p>
                identifier size:
                <span class="text-muted-foreground">{result.idSize} ({(result.idSize || 0) * 8}-bit)</span>
            </p>
            <p>
                total size:
                <span class="text-muted-foreground">
                    {humanSize(result.entries.reduce((acc, v) => acc + v.totalSize, 0))}
                </span>
            </p>
        </div>
        <Separator />
    </div>
    <Table class="h-full min-h-0 w-full p-2" entries={readable(result.entries)} />
{:catch e}
    <div class="flex h-full w-full flex-col items-center justify-center">
        <FileQuestion class="mb-4 animate-bounce text-muted-foreground" size={128} />
        <p class="mb-1 text-2xl font-semibold">Is the file in HPROF format?</p>
        <p class="mb-32 text-sm text-muted-foreground">Failed to read heap dump.</p>
        <p class="text-xs text-muted-foreground">{e}</p>
    </div>
{/await}
