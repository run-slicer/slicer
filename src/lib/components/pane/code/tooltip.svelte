<script lang="ts">
    import type { TooltipProps } from "$lib/components/editor/editor.svelte";
    import type { TypeReferenceResolver } from "@katana-project/laser";
    import type { EventHandler } from "$lib/event";
    import type { Entry } from "$lib/workspace";
    import { cn } from "$lib/components/utils";
    import { resolveClassNavigator } from "$lib/utils";
    import { index } from "$lib/workspace/jdk";

    interface Props extends TooltipProps {
        resolver: TypeReferenceResolver | null;
        classes: Map<string, Entry>;
        handler: EventHandler;
    }

    let { view, pos, side, resolver, classes, handler }: Props = $props();

    let resolution = $derived(resolver?.resolveAt(pos, side));

    const { packageName, simpleName, navigateToClass } = $derived(
        resolveClassNavigator(resolution ?? null, handler, view, classes, index)
    );
</script>

{#if resolution}
    <div
        class="text-card-foreground bg-card animate-in fade-in-0 zoom-in-95 border-border z-50 flex max-w-md cursor-pointer flex-col rounded-sm border shadow-lg"
        onclick={navigateToClass}
        onkeydown={navigateToClass}
        role="button"
        tabindex="0"
    >
        <div class="border-border hover:bg-accent-foreground/5 border-b px-3 py-2 transition-colors">
            <div class="flex flex-col gap-1">
                <div class="text-foreground break-anywhere text-sm font-semibold">
                    {simpleName?.replaceAll("$", ".")}
                </div>

                <div class={cn("text-muted-foreground break-anywhere text-[11px]", !packageName && "italic")}>
                    {packageName?.replaceAll("/", ".") || "default package"}
                </div>
            </div>
        </div>
    </div>
{/if}
