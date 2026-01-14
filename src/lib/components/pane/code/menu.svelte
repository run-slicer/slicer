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
    import { resolvedReference } from "./resolverExtension";
    import { resolveClassNavigator } from "$lib/utils";
    import { index } from "$lib/workspace/jdk";

    interface Props {
        view: EditorView | null;
        classes: Map<string, Entry>
        tab: Tab;
        interpType: Interpretation;
        lang: Language;
        value: string;
        wrap: boolean;
        sizeSync: boolean;
        handler: EventHandler;
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
    }: Props = $props();
    let entry = $derived(tab.entry!);

    const resolved = $derived(interpType === Interpretation.CLASS ? $resolvedReference : null);

    const navigator = $derived.by(() => view ? resolveClassNavigator(resolved, handler, view, classes, index) : null);

    const navigateToClass = () =>
        navigator?.navigateToClass();
</script>

<ContextMenuContent class="min-w-48">
    {#if view && resolved}
        <ContextMenuLabel inset>{$t("pane.code.menu.reference")}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem inset class="flex justify-between gap-5" onclick={navigateToClass}>
            {$t("pane.code.menu.reference.declaration")}
            <CornerDownRight size={16} class="text-foreground" />
        </ContextMenuItem>

        <ContextMenuItem inset class="flex justify-between">
            {$t("pane.code.menu.reference.usages")}
            <TextSearch size={16} />
        </ContextMenuItem>
        <ContextMenuSeparator />
    {/if}
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
