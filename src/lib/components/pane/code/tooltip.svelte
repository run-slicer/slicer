<script lang="ts">
    import type { TooltipProps } from "$lib/components/editor/editor.svelte";
    import type { TypeReferenceResolver } from "@katana-project/laser";
    import type { EventHandler } from "$lib/event";
    import type { Entry } from "$lib/workspace";
    import { cn } from "$lib/components/utils";
    import { index } from "$lib/workspace/jdk";
    import { resolveType } from "$lib/components/pane/code/resolver";
    import { prettyInternalName } from "$lib/utils";
    import { t } from "$lib/i18n";

    interface Props extends TooltipProps {
        resolver: TypeReferenceResolver | null;
        classes: Map<string, Entry>;
        handler: EventHandler;
    }

    let { view, pos, side, resolver, classes, handler }: Props = $props();

    let resolution = $derived(resolver?.resolveAt(pos, side));
    let { className, packageName, simpleName, open } = $derived(
        resolveType(resolution ?? null, handler, view, classes, index)
    );
</script>

{#if className && resolution?.kind !== "builtin"}
    <div
        class="text-card-foreground bg-card animate-in fade-in-0 zoom-in-95 border-border z-50 flex max-w-md cursor-pointer flex-col rounded-sm border shadow-lg"
        onclick={open}
        onkeydown={open}
        role="button"
        tabindex="0"
    >
        <div class="border-border hover:bg-accent-foreground/5 border-b px-3 py-2 transition-colors">
            <div class="flex flex-col gap-1">
                <div class="text-foreground break-anywhere text-sm font-semibold">
                    {prettyInternalName(simpleName || "")}
                </div>

                <div class={cn("text-muted-foreground break-anywhere text-[11px]", !packageName && "italic")}>
                    {packageName ? prettyInternalName(packageName) : $t("pane.code.tooltip.default-package")}
                </div>
            </div>
        </div>
    </div>
{/if}
