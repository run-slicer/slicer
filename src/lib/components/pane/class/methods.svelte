<script lang="ts">
    import { ElementType, formatMod, escapeLiteral } from "@run-slicer/asm/analysis/disasm";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";
    import { Code, Ellipsis, GitBranchPlus } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { type ClassEntry, memberEntry } from "$lib/workspace";
    import { TabType } from "$lib/tab";
    import type { EventHandler } from "$lib/event";

    interface Props {
        entry: ClassEntry;
        handler: EventHandler;
    }

    let { entry, handler }: Props = $props();
    const node = $derived(entry.node);
</script>

<Table>
    <TableHeader class="sticky top-0 z-10 bg-background shadow-lg">
        <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Modifiers</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead></TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#if node.methods.length > 0}
            {#each node.methods as method, i (i)}
                {@const mods = formatMod(method.access, ElementType.METHOD)}
                <TableRow>
                    <TableCell class="font-medium">{i}</TableCell>
                    <TableCell>
                        <span class="break-anywhere font-mono tracking-tight">
                            {mods || "<none>"}
                        </span>
                        ({method.access})
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">
                        {escapeLiteral(method.name.string)}
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">{method.type.string}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                {#snippet child({ props })}
                                    <Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
                                        <span class="sr-only">Open menu</span>
                                        <Ellipsis class="size-4" />
                                    </Button>
                                {/snippet}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="w-[12rem]" align="end">
                                <DropdownMenuItem
                                    class="justify-between"
                                    onclick={() => handler.open(memberEntry(entry, method), TabType.CODE)}
                                >
                                    Disassemble <Code size={16} />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="justify-between"
                                    onclick={() => handler.open(memberEntry(entry, method), TabType.FLOW_GRAPH)}
                                >
                                    View flow graph <GitBranchPlus size={16} />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={5} class="h-24 text-center">No methods.</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
