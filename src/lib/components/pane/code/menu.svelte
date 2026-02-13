<script lang="ts">
    import type { Tab } from "$lib/tab";
    import { transformEntry, type Entry } from "$lib/workspace";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuCheckboxItem,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
        ContextMenuSeparator,
    } from "$lib/components/ui/context-menu";
    import ContextMenuLabel from "$lib/components/menu_label.svelte";
    import { Binary, CaseSensitive, Code, CornerDownRight, TextSearch, TextWrap, Workflow } from "@lucide/svelte";
    import { type Language, toExtension } from "$lib/lang";
    import { Interpretation } from "./";
    import type { EventHandler } from "$lib/event";
    import { t } from "$lib/i18n";
    import type { EditorView } from "@codemirror/view";
    import { prettyInternalName } from "$lib/utils";
    import FloatingModal from "$lib/components/floating_modal.svelte";
    import UsagesContent from "./usages.svelte";
    import type { TypeReferenceResolver } from "@katana-project/laser";
    import { resolveType } from "./resolver";
    import HierarchyContent from "./hierarchy.svelte";
    import { inheritanceGraph } from "$lib/workspace/analysis/graph";

    interface Props {
        view: EditorView | null;
        classes: Map<string, Entry>;
        tab: Tab;
        interpType: Interpretation;
        lang: Language;
        value: string;
        wrap: boolean;
        sizeSync: boolean;
        handler: EventHandler;
        resolver: TypeReferenceResolver | null;
        mousePosition: { x: number; y: number };
    }

    let {
        view = $bindable(),
        classes,
        tab,
        interpType,
        lang,
        value,
        handler,
        wrap = $bindable(),
        sizeSync = $bindable(),
        resolver = $bindable(),
        mousePosition = $bindable(),
    }: Props = $props();
    let entry = $derived(tab.entry!);

    const resolved = $derived.by(() => {
        const coords = view?.posAndSideAtCoords(mousePosition);
        if (!coords || !resolver || interpType !== Interpretation.CLASS) {
            return null;
        }

        const resolved = resolver.resolveAt(coords.pos, coords.assoc);
        return resolved && resolved.kind !== "builtin" ? resolved : null;
    });

    let detail = $derived(view ? resolveType(resolved, handler, view, classes) : null);

    let usagesOpen = $state(false);

    let hierarchyOpen = $state(false);
    let hasGraphNode = $derived($inheritanceGraph[detail?.className ?? ""] !== undefined);
</script>

<ContextMenuContent class="min-w-54">
    {@const hasReference = view && resolved}
    <ContextMenuLabel inset>{$t("pane.code.menu.reference")}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem
        inset
        class="flex justify-between gap-5"
        disabled={!hasReference || !detail?.canOpen}
        onclick={() => detail?.open()}
    >
        {$t("pane.code.menu.reference.declaration")}
        <CornerDownRight size={16} class="text-foreground" />
    </ContextMenuItem>
    <ContextMenuItem inset class="flex justify-between" disabled={!hasReference} onclick={() => (usagesOpen = true)}>
        {$t("pane.code.menu.reference.usages")}
        <TextSearch size={16} />
    </ContextMenuItem>
    <ContextMenuItem
        inset
        class="flex justify-between gap-5"
        disabled={!hasReference || !hasGraphNode}
        onclick={() => (hierarchyOpen = true)}
    >
        {$t("pane.code.menu.reference.implementations")}
        <Workflow size={16} class="text-foreground" />
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuLabel inset>{$t("pane.code.menu.editor")}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuCheckboxItem class="justify-between" bind:checked={wrap}>
        {$t("pane.code.menu.editor.wrap")}
        <TextWrap size={16} />
    </ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem class="justify-between" bind:checked={sizeSync}>
        {$t("pane.code.menu.editor.lock-zoom")}
        <CaseSensitive size={16} />
    </ContextMenuCheckboxItem>
    <ContextMenuSeparator />
    <ContextMenuLabel inset>{$t("pane.code.menu.file")}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuSub>
        <ContextMenuSubTrigger inset>{$t("pane.code.menu.file.export")}</ContextMenuSubTrigger>
        <ContextMenuSubContent class="min-w-48">
            <ContextMenuItem class="flex justify-between" onclick={() => handler.export([entry])}>
                {$t("pane.code.menu.file.export.raw")}
                <Binary size={16} />
            </ContextMenuItem>
            <ContextMenuItem
                class="flex justify-between"
                disabled={interpType === Interpretation.TEXT}
                onclick={() => handler.export([transformEntry(entry, toExtension(lang), value)])}
            >
                {$t("pane.code.menu.file.export.disasm")}
                <Code size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>

<FloatingModal
    bind:open={usagesOpen}
    title={$t("modal.usages.title")}
    subtitle={$t(
        detail?.className ? "modal.usages.subtitle" : "modal.usages.subtitle.none",
        prettyInternalName(detail?.className || "")
    )}
    initialPosition={mousePosition}
>
    <UsagesContent bind:open={usagesOpen} name={detail?.className ?? null} {classes} {handler} />
</FloatingModal>

<FloatingModal
    bind:open={hierarchyOpen}
    title={$t("modal.hierarchy.title")}
    subtitle={$t(
        detail?.className ? "modal.hierarchy.subtitle" : "modal.hierarchy.subtitle.none",
        prettyInternalName(detail?.className || "")
    )}
    initialPosition={mousePosition}
>
    <HierarchyContent bind:open={hierarchyOpen} name={detail?.className ?? null} {handler} />
</FloatingModal>
