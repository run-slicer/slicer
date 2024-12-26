<script lang="ts">
    import type { Member } from "@run-slicer/asm";
    import { ElementType, formatMod } from "@run-slicer/asm/analysis/disasm";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";
    import { Code, Ellipsis, GitBranchPlus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { type ClassEntry, memberEntry } from "$lib/workspace";
    import { type ActionHandler, ActionType, type OpenAction } from "$lib/action";
    import { TabType } from "$lib/tab";

    interface Props {
        entry: ClassEntry;
        onaction?: ActionHandler;
    }

    let { entry, onaction }: Props = $props();
    const node = $derived(entry.node);

    const openEntry = (method: Member, tabType?: TabType) => {
        onaction?.({
            type: ActionType.OPEN,
            tabType,
            entry: memberEntry(entry, method),
        } as OpenAction);
    };
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
                    <TableCell class="break-anywhere font-mono tracking-tight">{method.name.decode()}</TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">{method.type.decode()}</TableCell>
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
                                    onclick={() => openEntry(method, TabType.CODE)}
                                >
                                    Disassemble <Code size={16} />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="justify-between"
                                    onclick={() => openEntry(method, TabType.FLOW_GRAPH)}
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
