<script lang="ts" module>
    import type { Entry } from "$lib/workspace";
    import type { Node } from "./node.svelte";

    export const collectEntries = (node: Node): Entry[] => {
        const entries = node.entry ? [node.entry] : [];
        if (node.nodes) {
            entries.push(...node.nodes.flatMap(collectEntries));
        }

        return entries;
    };
</script>

<script lang="ts">
    import { Binary, Code, Download, FileCode2, Gauge, GitBranchPlus, Image, Trash2 } from "@lucide/svelte";
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

<ContextMenuContent class="max-w-[16rem] min-w-48">
    <ContextMenuLabel center>{node.label}</ContextMenuLabel>
    <ContextMenuSeparator />
    {#if entry}
        <ContextMenuSub>
            <ContextMenuSubTrigger>Open as</ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-48">
                {#if entry.type !== EntryType.ARCHIVE}
                    <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry, TabType.CODE)}>
                        Code <Code size={16} />
                    </ContextMenuItem>
                {/if}
                <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry, TabType.HEX)}>
                    Hexadecimal <Binary size={16} />
                </ContextMenuItem>
                <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry, TabType.IMAGE)}>
                    Image <Image size={16} />
                </ContextMenuItem>
                {#if entry.type !== EntryType.ARCHIVE}
                    <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry, TabType.GRAPH)}>
                        Graph <GitBranchPlus size={16} />
                    </ContextMenuItem>
                    <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry, TabType.CLASS)}>
                        Class <FileCode2 size={16} />
                    </ContextMenuItem>
                {/if}
                <ContextMenuItem class="flex justify-between" onclick={() => handler.open(entry, TabType.HEAP_DUMP)}>
                    Heap dump <Gauge size={16} />
                </ContextMenuItem>
            </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem class="flex justify-between" onclick={() => handler.export([entry])}>
            Export <Download size={16} />
        </ContextMenuItem>
    {/if}
    <ContextMenuItem
        class="data-highlighted:bg-destructive data-highlighted:text-primary-foreground flex justify-between"
        onclick={() => modals.open(DeleteDialog, { entries: collectEntries(node), handler })}
    >
        Delete <Trash2 size={16} />
    </ContextMenuItem>
</ContextMenuContent>
