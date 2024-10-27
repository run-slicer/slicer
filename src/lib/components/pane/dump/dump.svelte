<script lang="ts">
    import { read, ReaderFlags } from "@run-slicer/hprof";
    import { slurp } from "@run-slicer/hprof/slurp";
    import Loading from "$lib/components/loading.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import type { Tab } from "$lib/tab";
    import type { Entry } from "$lib/workspace";
    import { error } from "$lib/log";
    import { FileQuestion } from "lucide-svelte";

    export let tab: Tab;
    const entry = tab.entry!;

    const result = slurp();
    const readEntry = async (entry: Entry) => {
        try {
            await read(await entry.data.stream(), result, ReaderFlags.SKIP_VALUES);
        } catch (e) {
            error("failed to read heap dump", e);

            throw e;
        }
    };
</script>

{#await readEntry(entry)}
    <Loading value="Reading..." />
{:then _}
    <div class="flex h-8 min-h-8 w-full flex-col">
        <div class="flex grow flex-row items-center gap-4 bg-background px-2 text-xs">
            <p>timestamp: <span class="text-muted-foreground">{result.timestamp?.toLocaleString()}</span></p>
            <p>
                identifier size:
                <span class="text-muted-foreground">{result.idSize} ({(result.idSize || 0) * 8}-bit)</span>
            </p>
        </div>
        <Separator />
    </div>
{:catch e}
    <div class="flex h-full w-full flex-col items-center justify-center">
        <FileQuestion class="mb-4 animate-bounce text-muted-foreground" size={128} />
        <p class="mb-1 text-2xl font-semibold">Is the file in HPROF format?</p>
        <p class="mb-32 text-sm text-muted-foreground">Failed to read heap dump.</p>
        <p class="text-xs text-muted-foreground">{e}</p>
    </div>
{/await}
