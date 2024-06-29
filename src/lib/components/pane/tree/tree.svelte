<script lang="ts">
    import { Folders, Plus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import type { Entry } from "$lib/workspace";
    import TreeNode, { type Node } from "./node.svelte";
    import { open } from "$lib/action/open";
    import { load } from "$lib/action/load";
    import { PaneHeader } from "$lib/components/pane";

    let root: Node = { label: "<root>", nodes: [] };
    const updateNode = (entry: Entry) => {
        let curr = root;

        for (const part of entry.data.name.split("/")) {
            if (!curr.nodes) curr.nodes = [];

            let next = curr.nodes.find((n) => n.label === part);
            if (!next) {
                next = { label: part };
                curr.nodes.push(next);
            }

            curr = next;
        }

        curr.action = () => open(entry); // add action on leaf node
    };

    export let entries: Entry[];
    $: {
        root.nodes = [];
        entries.forEach(updateNode);

        root.nodes.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes)); // non-leaf nodes go first
        root = root; // force an update
    }
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader name="Project" icon={Folders} />
    <div class="flex h-full w-full overflow-scroll scrollbar-thin text-nowrap p-2">
        {#if root.nodes && root.nodes.length > 0}
            <div class="block">
                {#each root.nodes as node (node.label)}
                    <TreeNode data={node} />
                {/each}
            </div>
        {:else}
            <div class="flex grow items-center justify-center">
                <Button variant="outline" size="sm" on:click={load}>
                    <Plus class="mr-2 h-4 w-4" />
                    Add
                </Button>
            </div>
        {/if}
    </div>
</div>
