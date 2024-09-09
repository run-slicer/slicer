<script lang="ts" context="module">
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
    import { createEventDispatcher } from "svelte";
    import { Folders, Plus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane/header";
    import { ActionType } from "$lib/action";
    import TreeNode from "./node.svelte";
    import NodeMenu from "./menu.svelte";

    let root: Node = { label: "<root>", nodes: [] };
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

    export let entries: Entry[];
    $: {
        root.nodes = [];
        entries.forEach(updateNode);

        root.nodes.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes)); // non-leaf nodes go first
        root = root; // force an update
    }

    let menuData: Node | null = null;

    let triggerElem: HTMLDivElement;

    const dispatch = createEventDispatcher();
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
        <ContextMenuTrigger
            bind:el={triggerElem}
            class="flex h-full w-full overflow-auto text-nowrap p-2 scrollbar-thin"
        >
            {#if root.nodes && root.nodes.length > 0}
                <div class="flex w-full flex-col">
                    {#each root.nodes as node (node.label)}
                        <TreeNode
                            data={node}
                            on:open={(e) => dispatch("action", { type: ActionType.OPEN, entry: e.detail.data.entry })}
                            on:contextmenu={(e) => {
                                menuData = e.detail.data;
                                // replay contextmenu event on trigger
                                triggerElem.dispatchEvent(e.detail.event);
                            }}
                        />
                    {/each}
                </div>
            {:else}
                <div class="flex grow items-center justify-center">
                    <Button variant="outline" size="sm" on:click={() => dispatch("action", { type: ActionType.LOAD })}>
                        <Plus class="mr-2 h-4 w-4" /> Open
                    </Button>
                </div>
            {/if}
        </ContextMenuTrigger>
        {#if menuData}
            <NodeMenu node={menuData} on:action />
        {/if}
    </ContextMenu>
</div>
