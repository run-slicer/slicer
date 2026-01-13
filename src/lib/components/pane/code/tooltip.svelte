<script lang="ts" module>
    export const kindColors = {
        declared: "text-blue-400 bg-blue-950/30 border-blue-900/50",
        imported: "text-green-400 bg-green-950/30 border-green-900/50",
        builtin: "text-purple-400 bg-purple-950/30 border-purple-900/50",
    };

    export const kindIcons = {
        declared: "●",
        imported: "→",
        builtin: "◆",
    };
</script>

<script lang="ts">
    import type { TooltipProps } from "$lib/components/editor/editor.svelte";
    import type { TypeReferenceResolver } from "@katana-project/laser";
    import type { EventHandler } from "$lib/event";
    import type { Entry } from "$lib/workspace";
    import { cn } from "$lib/components/utils";
    import { t } from "$lib/i18n";
    import { index } from "$lib/workspace/jdk";
    import { EditorView } from "@codemirror/view";

    interface Props extends TooltipProps {
        resolver: TypeReferenceResolver | null;
        classes: Map<string, Entry>;
        handler: EventHandler;
    }

    let { view, pos, side, resolver, classes, handler }: Props = $props();

    let resolution = $derived(resolver?.resolveAt(pos, side));

    let className = $derived.by(() => {
        if (!resolution?.qualifiedName) return null;

        // hack job to resolve inner classes
        const parts = resolution.qualifiedName.split("."),
            popped: string[] = [];
        while (parts.length > 0) {
            const candidate = parts.join("/") + (popped.length > 0 ? "$" + popped.toReversed().join("$") : "");
            if (classes.has(candidate) || index.has(candidate)) {
                return candidate;
            }
            popped.push(parts.pop()!);
        }

        return null;
    });

    let [packageName, simpleName] = $derived.by(() => {
        if (!className) return [null, null];

        const lastSlash = className.lastIndexOf("/");
        return lastSlash > 0
            ? [className.substring(0, lastSlash), className.substring(lastSlash + 1)]
            : [null, className];
    });

    const navigateToClass = () => {
        if (resolution?.kind === "declared" && resolution.declaration) {
            view.dispatch({
                selection: { anchor: resolution.declaration.from },
                effects: EditorView.scrollIntoView(resolution.declaration.from),
            });
        } else if (className) {
            const entry = classes.get(className);
            if (entry) {
                handler.open(entry);
            }
        }
    };
</script>

{#if resolution && resolution.kind !== "unresolved"}
    <div
        class={"text-card-foreground bg-card animate-in fade-in-0 zoom-in-95 border-border z-50 flex max-w-md flex-col rounded-sm border shadow-lg"}
        onclick={navigateToClass}
        onkeydown={navigateToClass}
        role="button"
        tabindex="0"
    >
        <div class="flex flex-col">
            <div class="border-border hover:bg-accent-foreground/5 border-b px-3 py-2 font-mono transition-colors">
                <div class="flex flex-col gap-1">
                    <div class="text-foreground break-anywhere text-sm font-semibold">
                        {simpleName?.replaceAll("$", ".")}
                    </div>

                    <div class={cn("text-muted-foreground break-anywhere text-[11px]", !packageName && "italic")}>
                        {packageName?.replaceAll("/", ".") || "default package"}
                    </div>
                </div>
            </div>

            <div class="px-3 py-2.5">
                <span
                    class="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase {kindColors[
                        resolution.kind
                    ]}"
                >
                    <span>{kindIcons[resolution.kind]}</span>
                    <span>{$t(`pane.code.tooltip.kind.${resolution.kind}`)}</span>
                </span>
            </div>
        </div>
    </div>
{/if}
