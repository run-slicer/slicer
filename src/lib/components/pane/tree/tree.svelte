<script lang="ts" module>
    export const labels = [
        {
            label: "Files and directories",
            value: "file",
        },
        {
            label: "Packages",
            value: "package",
        },
    ];
</script>

<script lang="ts">
    import { Plus } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import TreeNode from "./node.svelte";
    import NodeMenu from "./menu.svelte";
    import type { PaneProps } from "$lib/components/pane";
    import type { Node } from "./node.svelte";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { type ProjectMode, projectMode } from "$lib/state";
    import { EntryType, entryRef } from "$lib/workspace";

    let { entries, handler }: PaneProps = $props();

    const collapseSingleChildDirs = (node: Node, mode: ProjectMode) => {
        if (!node.nodes) return;

        for (let i = 0; i < node.nodes.length; i++) {
            let child = node.nodes[i];
            while (child.nodes?.length === 1 && !child.entry && !child.nodes[0].entry) {
                // collapse label
                const next = child.nodes[0];
                child.label += "/" + next.label;
                child.nodes = next.nodes;
            }

            // convert valid Java package paths to package notation
            if (mode === "package" && !child.label.includes(".")) {
                const notation = child.label.replaceAll("/", ".");
                if (notation.match(/^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)*[0-9a-z_]$/i)) {
                    child.label = notation;
                    child.package = true;
                }
            }

            collapseSingleChildDirs(child, mode);
        }
    };

    let root: Node = $derived.by(() => {
        const root: Node = { label: "<root>", nodes: [] };

        for (const entry of entries) {
            let name = entry.name;
            if ($projectMode === "package") {
                if (entry.extension !== "class" && entry.type !== EntryType.ARCHIVE) {
                    // skip non-class entries in package mode
                    // allow archives, as they can contain class files
                    continue;
                }

                name = entry.name.replace(/\.class$/, ""); // remove .class extension for package mode
            }

            let curr = root;
            for (const part of name.split("/")) {
                if (!curr.nodes) curr.nodes = [];

                let next = curr.nodes.find((n) => n.label === part);
                if (!next) {
                    next = { label: part, parent: curr };
                    curr.nodes.push(next);
                }

                curr = next;
            }

            curr.entry = entryRef(entry);
        }

        root.nodes?.sort((a, b) => +Boolean(b.nodes) - +Boolean(a.nodes)); // non-leaf nodes go first

        collapseSingleChildDirs(root, $projectMode);

        return root;
    });

    let menuData: Node | null = $state(null);

    let triggerElem: HTMLDivElement | null = $state(null);

    const open = (data: Node) => handler.open(data.entry!.value);

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
            {#if root.nodes && entries.length > 0}
                <div class="scrollbar-thin flex w-full flex-col overflow-auto p-2 text-nowrap contain-strict">
                    {#each root.nodes as node (node.label)}
                        <TreeNode
                            mode={$projectMode}
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
<Select type="single" bind:value={$projectMode}>
    <SelectTrigger
        class="border-t-border h-7 w-full rounded-none border-0 border-t text-xs [&_svg]:ml-2 [&_svg]:h-4 [&_svg]:w-4"
    >
        <span>
            <span class="text-muted-foreground mr-2">Mode:</span>
            {labels.find((l) => l.value === $projectMode)?.label}
        </span>
    </SelectTrigger>
    <SelectContent side="top" align="center" class="[&>*]:min-w-[calc(var(--bits-select-anchor-width)-16px)]">
        {#each labels as { label, value }}
            <SelectItem {value} {label} class="text-xs">
                {label}
            </SelectItem>
        {/each}
    </SelectContent>
</Select>
