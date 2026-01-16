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
    import { Binary, CaseSensitive, Code, CornerDownRight, TextSearch, TextWrap } from "@lucide/svelte";
    import { type Language, toExtension } from "$lib/lang";
    import { Interpretation } from "./";
    import type { EventHandler } from "$lib/event";
    import { t } from "$lib/i18n";
    import type { EditorView } from "@codemirror/view";
    import { resolveClassNavigator, type Cancellable } from "$lib/utils";
    import { index } from "$lib/workspace/jdk";
    import { QueryType, search, SearchMode, type SearchResult } from "$lib/workspace/analysis";
    import FloatingModal from "$lib/components/floating_modal.svelte";
    import UsagesContent from "./usages.svelte";
    import type { TypeReferenceResolver } from "@katana-project/laser";
    import { error } from "$lib/log";
    import { toast } from "svelte-sonner";

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

    let navigator = $derived(view ? resolveClassNavigator(resolved, handler, view, classes, index) : null);

    let usagesOpen = $state(false);
    let usages: SearchResult[] = $state.raw([]);
    let referenceName: string | null = $state(null);
    let task: Cancellable<void> | null = $state(null);

    $effect(() => {
        if (!usagesOpen) {
            usages = [];
            referenceName = null;
            task?.cancel();
            task = null;
        }
    });

    const findUsages = async () => {
        if (!view || !navigator || !navigator.className) return;

        const className = navigator.className;

        referenceName = className;
        try {
            usages = [];
            usagesOpen = true;
            task = search(
                Array.from(classes.values()),
                { type: QueryType.PSEUDOCODE, value: className, mode: SearchMode.PARTIAL_MATCH, ref: true },
                (res) => {
                    usages = [...usages, res];
                }
            );
        } catch (e) {
            error("failed to search", e);
            toast.error($t("toast.error.title.generic"), {
                description: $t("toast.error.search"),
            });
        }
    };

    let modalElement: HTMLDivElement | undefined = $state(undefined);
    let position = $state({ x: 0, y: 0 });

    $effect(() => {
        if (usagesOpen && usages && modalElement) {
            // get the actual size of the modal
            const rect = modalElement.getBoundingClientRect();
            position = {
                x: window.innerWidth / 2 - rect.width / 2,
                y: window.innerHeight / 2 - rect.height / 2,
            };
        }
    });
</script>

<ContextMenuContent class="min-w-48">
    {@const hasReference = view && resolved}
    <ContextMenuLabel inset>{$t("pane.code.menu.reference")}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem
        inset
        class="flex justify-between gap-5"
        disabled={!hasReference || !navigator?.isWorkspaceEntry}
        onclick={() => navigator?.navigateToClass()}
    >
        {$t("pane.code.menu.reference.declaration")}
        <CornerDownRight size={16} class="text-foreground" />
    </ContextMenuItem>
    <ContextMenuItem inset class="flex justify-between" disabled={!hasReference} onclick={findUsages}>
        {$t("pane.code.menu.reference.usages")}
        <TextSearch size={16} />
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
    subtitle={$t("modal.usages.subtitle", referenceName)}
    initialPosition={position}
    bind:modalElement
>
    <UsagesContent bind:open={usagesOpen} data={usages} {handler} />
</FloatingModal>
