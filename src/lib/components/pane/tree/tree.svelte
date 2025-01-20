<script lang="ts" module>
    import type { Entry } from "$lib/workspace";
    import type { Node } from "./node.svelte";

    export const collectEntries = (node: Node): Entry[] => {
        if (node.nodes) {
            return node.nodes.flatMap(collectEntries);
        }

        return node.entry ? [node.entry] : [];
    };
</script>

<script lang="ts">
    import { Plus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { DeleteDialog } from "$lib/components/dialog";
    import TreeNode from "./node.svelte";
    import NodeMenu from "./menu.svelte";
    import type { EventHandler } from "$lib/event";

    interface Props {
        entries: Entry[];
        handler: EventHandler;
    }

    let { entries, handler }: Props = $props();

    let root: Node = $derived.by(() => {
        const root: Node = { label: "<root>", nodes: [] };

        for (const entry of entries) {
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
        }

        root.nodes?.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes)); // non-leaf nodes go first
        return root;
    });

    let menuData: Node | null = $state(null);
    let deleteData: Entry[] | null = $state(null);

    let triggerElem: HTMLDivElement | null = $state(null);

    const open = (data: Node) => handler.open(data.entry!);

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();

        if (e.dataTransfer) {
            await handler.add(
                e.dataTransfer.items
                    ? [...e.dataTransfer.items].filter((i) => i.kind === "file").map((i) => i.getAsFile()!)
                    : [...e.dataTransfer.files]
            );
        }
    };
</script>

<ContextMenu
    onOpenChange={(open) => {
        if (!open) {
            menuData = null;
        }
    }}
>
    <ContextMenuTrigger bind:ref={triggerElem} class="flex h-full w-full">
        <div class="flex h-full w-full" role="presentation" ondrop={handleDrop} ondragover={(e) => e.preventDefault()}>
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
                <div class="flex grow flex-col items-center justify-center gap-4">
                    <Button variant="outline" size="sm" onclick={() => handler.load()}>
                        <Plus /> Open
                    </Button>
                    <span class="text-xs text-muted-foreground">or</span>
                    <span class="text-sm text-accent-foreground">drag n' drop</span>
                </div>
            {/if}
        </div>
    </ContextMenuTrigger>
    {#if menuData}
        <NodeMenu node={menuData} ondelete={(node) => (deleteData = collectEntries(node))} {handler} />
    {/if}
</ContextMenu>

<DeleteDialog bind:entries={deleteData} {handler} />
