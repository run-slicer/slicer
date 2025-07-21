<script lang="ts">
    import { Plus } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import TreeNode from "./node.svelte";
    import NodeMenu from "./menu.svelte";
    import type { PaneProps } from "$lib/components/pane";
    import type { Node } from "./node.svelte";

    let { entries, handler }: PaneProps = $props();

    const collapseSingleChildDirs = (node: Node) => {
        if (!node.nodes) return;

        for (let i = 0; i < node.nodes.length; i++) {
            let child = node.nodes[i];
            while (child.nodes?.length === 1 && !child.entry && !child.nodes[0].entry) {
                // collapse label
                const next = child.nodes[0];
                child.label += "." + next.label;
                child.nodes = next.nodes;
            }

            collapseSingleChildDirs(child);
        }
    };

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

        collapseSingleChildDirs(root);

        return root;
    });

    let menuData: Node | null = $state(null);

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
                <div class="scrollbar-thin flex w-full flex-col overflow-auto p-2 text-nowrap contain-strict">
                    {#each root.nodes as node (node.label)}
                        <TreeNode
                            {entries}
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
                    <span class="text-muted-foreground text-xs">or</span>
                    <span class="text-accent-foreground text-sm">drag n' drop</span>
                </div>
            {/if}
        </div>
    </ContextMenuTrigger>
    {#if menuData}
        <NodeMenu node={menuData} {handler} />
    {/if}
</ContextMenu>
