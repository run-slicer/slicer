<script lang="ts" context="module">
    import type { TabType } from "$lib/tab";

    export interface Action {
        type: "open" | "delete" | "download";
        data: Node;
        tabType?: TabType;
    }
</script>

<script lang="ts">
    import { Folders, Plus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import type { Entry } from "$lib/workspace";
    import TreeNode from "./node.svelte";
    import { type Node, openEntry, exportEntry } from "./";
    import DeleteDialog from "./dialog/delete.svelte";
    import { load } from "$lib/action";
    import { PaneHeader, PaneHeaderItem } from "$lib/components/pane";

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

    const processAction = async (action: Action) => {
        const { type, data, tabType } = action;

        switch (type) {
            case "open":
                await openEntry(data, tabType);
                break;
            case "delete":
                deleteData = data;
                break;
            case "download":
                await exportEntry(data);
                break;
        }
    };
</script>

<div class="flex h-full w-full flex-col">
    <PaneHeader>
        <PaneHeaderItem name="Project" icon={{ icon: Folders, classes: ["text-muted-foreground"] }} />
    </PaneHeader>
    <div class="flex h-full w-full overflow-auto text-nowrap p-2 scrollbar-thin">
        {#if root.nodes && root.nodes.length > 0}
            <div class="flex w-full flex-col">
                {#each root.nodes as node (node.label)}
                    <TreeNode data={node} on:action={(e) => processAction(e.detail)} />
                {/each}
            </div>
        {:else}
            <div class="flex grow items-center justify-center">
                <Button variant="outline" size="sm" on:click={load}>
                    <Plus class="mr-2 h-4 w-4" /> Open
                </Button>
            </div>
        {/if}
    </div>
</div>

<DeleteDialog bind:data={deleteData} />
