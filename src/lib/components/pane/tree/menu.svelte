<script lang="ts" module>
    import type { Node } from "./node.svelte";
    import type { Entry } from "$lib/workspace";
    import { t } from "$lib/i18n";

    export const collectEntries = (node: Node): Entry[] => {
        const entries = node.entry ? [node.entry.value] : [];
        if (node.nodes) {
            entries.push(...node.nodes.flatMap(collectEntries));
        }

        return entries;
    };
</script>

<script lang="ts">
    import { Code, Download, FileCode2, Gauge, GitBranchPlus, Image, Trash2 } from "@lucide/svelte";
    import { EntryType } from "$lib/workspace";
    import { TabType } from "$lib/tab";
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
    } from "$lib/components/ui/context-menu";
    import ContextMenuLabel from "$lib/components/menu_label.svelte";
    import type { EventHandler } from "$lib/event";
    import { modals } from "svelte-modals";
    import { DeleteDialog } from "$lib/components/dialog";

    interface Props {
        node: Node;
        handler: EventHandler;
    }

    let { node, handler }: Props = $props();
    let entry = $derived(node.entry);
</script>

<ContextMenuContent class="w-48">
    <ContextMenuLabel>{node.label}</ContextMenuLabel>
    <ContextMenuSeparator />
    {#if entry}
        <ContextMenuSub>
            <ContextMenuSubTrigger>{$t("pane.project.menu.open")}</ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-48">
                <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry.value, TabType.CODE)}>
                    {$t("pane.project.menu.open.code")}
                    <Code size={16} />
                </ContextMenuItem>
                <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry.value, TabType.IMAGE)}>
                    {$t("pane.project.menu.open.image")}
                    <Image size={16} />
                </ContextMenuItem>
                {#if entry.value.type !== EntryType.ARCHIVE}
                    <ContextMenuItem
                        class="flex justify-between"
                        onclick={() => handler.open(entry.value, TabType.GRAPH)}
                    >
                        {$t("pane.project.menu.open.graph")}
                        <GitBranchPlus size={16} />
                    </ContextMenuItem>
                    <ContextMenuItem
                        class="flex justify-between"
                        onclick={() => handler.open(entry.value, TabType.CLASS)}
                    >
                        {$t("pane.project.menu.open.class")}
                        <FileCode2 size={16} />
                    </ContextMenuItem>
                {/if}
                <ContextMenuItem
                    class="flex justify-between"
                    onclick={() => handler.open(entry.value, TabType.HEAP_DUMP)}
                >
                    {$t("pane.project.menu.open.dump")}
                    <Gauge size={16} />
                </ContextMenuItem>
            </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem class="flex justify-between" onclick={() => handler.export([entry.value])}>
            {$t("pane.project.menu.export")}
            <Download size={16} />
        </ContextMenuItem>
    {/if}
    <ContextMenuItem
        class="data-highlighted:bg-destructive data-highlighted:text-primary-foreground flex justify-between"
        onclick={() => modals.open(DeleteDialog, { entries: collectEntries(node), handler })}
    >
        {$t("pane.project.menu.delete")}
        <Trash2 size={16} />
    </ContextMenuItem>
</ContextMenuContent>
