<script lang="ts" module>
    import type { Entry } from "$lib/workspace";
    import type { Node } from "./";

    export const collectEntries = (node: Node): Entry[] => {
        if (node.nodes) {
            return node.nodes.flatMap(collectEntries);
        }

        return node.entry ? [node.entry] : [];
    };
</script>

<script lang="ts">
    import { Folders, Plus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import { DeleteDialog } from "$lib/components/dialog";
    import { type Action, type ActionHandler, ActionType, type BulkEntryAction, type OpenAction } from "$lib/action";
    import TreeNode from "./node.svelte";
    import NodeMenu from "./menu.svelte";

    let root: Node = $state({ label: "<root>", nodes: [] });
    const updateNode = (entry: Entry) => {
        let curr = root;

        for (const part of entry.name.split("/")) {
            if (!curr.nodes) curr.nodes = [];

            let next = curr.nodes.find((n) => n.label === part);
            if (!next) {
                next = { label: part, parent: curr };
                curr.nodes.push(next);
            }

            curr = next;
        }

        curr.entry = entry;
    };

    interface Props {
        entries: Entry[];
        onaction?: ActionHandler;
    }

    let { entries, onaction }: Props = $props();
    $effect(() => {
        root.nodes = [];
        entries.forEach(updateNode);

        root.nodes.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes)); // non-leaf nodes go first
    });

    let menuData: Node | null = $state(null);
    let deleteData: Entry[] | null = $state(null);

    let triggerElem: HTMLDivElement | null = $state(null);

    const open = (data: Node) => onaction?.({ type: ActionType.OPEN, entry: data.entry! } as OpenAction);
    const handle = (action: Action) => {
        if (action.type === ActionType.REMOVE) {
            // prompt confirmation dialog
            deleteData = (action as BulkEntryAction).entries;
        } else {
            onaction?.(action);
        }
    };
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader>
        <PaneHeaderItem name="Project" icon={{ icon: Folders, classes: ["text-muted-foreground"] }} />
    </PaneHeader>
    <ContextMenu
        onOpenChange={(open) => {
            if (!open) {
                menuData = null;
            }
        }}
    >
        <ContextMenuTrigger bind:ref={triggerElem} class="flex h-full w-full">
            {#if root.nodes && root.nodes.length > 0}
                <div class="flex w-full flex-col overflow-auto text-nowrap p-2 contain-strict scrollbar-thin">
                    {#each root.nodes as node (node.label)}
                        <TreeNode
                            data={node}
                            onopen={open}
                            onmenu={(e, data) => {
                                menuData = data;
                                // replay contextmenu event on trigger
                                triggerElem?.dispatchEvent(e);
                            }}
                        />
                    {/each}
                </div>
            {:else}
                <div class="flex grow items-center justify-center">
                    <Button variant="outline" size="sm" onclick={() => onaction?.({ type: ActionType.LOAD })}>
                        <Plus /> Open
                    </Button>
                </div>
            {/if}
        </ContextMenuTrigger>
        {#if menuData}
            <NodeMenu node={menuData} onaction={handle} />
        {/if}
    </ContextMenu>
</div>

<DeleteDialog bind:entries={deleteData} {onaction} />
