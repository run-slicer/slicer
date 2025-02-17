<script lang="ts">
    import type { Result } from "./repl";
    import { prettyError, prettyObject } from "$lib/utils";
    import { ArrowLeft, ChevronsRight, CircleAlert } from "lucide-svelte";
    import { cn } from "$lib/components/utils";

    interface Props {
        result: Result;
    }

    let { result }: Props = $props();

    let error = $derived(result.error);
    let Icon = $derived(error ? CircleAlert : ArrowLeft);
</script>

<div
    class={cn(
        "flex flex-col gap-1.5 border-b border-b-border px-3 py-2 font-mono text-xs",
        error && "bg-destructive/60"
    )}
>
    <div class="flex flex-row">
        <ChevronsRight class="mr-2 size-4 min-w-4" />
        <span class="whitespace-pre-wrap">{result.expr}</span>
    </div>
    <div class={cn("flex flex-row", error || "text-muted-foreground")}>
        <Icon class="mr-2 size-4 min-w-4" />
        <span class="whitespace-pre-wrap">{error ? prettyError(result.value) : prettyObject(result.value)}</span>
    </div>
</div>
