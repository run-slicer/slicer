<script lang="ts">
    import { Folders, Plus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import type { Entry } from "$lib/workspace";
    import TreeNode from "./node.svelte";
    import { type Node, openEntry, deleteEntry } from "./";
    import { load } from "$lib/action/load";
    import { PaneHeader } from "$lib/components/pane";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";

    let root: Node = { label: "<root>", nodes: [] };
    const updateNode = (entry: Entry) => {
        let curr = root;

        for (const part of entry.data.name.split("/")) {
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

    let deleteData: Node | null = null;
    const handleDelete = () => {
        deleteEntry(deleteData!);
        deleteData = null;
    };
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader name="Project" icon={Folders} />
    <div class="flex h-full w-full overflow-auto text-nowrap p-2 scrollbar-thin">
        {#if root.nodes && root.nodes.length > 0}
            <div class="flex w-full flex-col">
                {#each root.nodes as node (node.label)}
                    <TreeNode
                        data={node}
                        on:open={(e) => openEntry(e.detail)}
                        on:delete={(e) => (deleteData = e.detail)}
                    />
                {/each}
            </div>
        {:else}
            <div class="flex grow items-center justify-center">
                <Button variant="outline" size="sm" on:click={load}>
                    <Plus class="mr-2 h-4 w-4" />
                    Open
                </Button>
            </div>
        {/if}
    </div>
</div>

<Dialog open={deleteData !== null}>
    <DialogContent class="sm:max-w-[425px]">
        {#if deleteData}
            <DialogHeader>
                <DialogTitle>Are you sure absolutely sure?</DialogTitle>
                <DialogDescription>
                    This will permanently delete <span class="break-all italic">{deleteData.label}</span> from the
                    workspace.
                    <p class="mt-2 font-semibold">This action cannot be undone.</p>
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button type="submit" variant="destructive" on:click={handleDelete}>Delete</Button>
            </DialogFooter>
        {/if}
    </DialogContent>
</Dialog>
