<script lang="ts">
    import { ElementType, formatMod, escapeLiteral } from "@katana-project/asm/analysis/disasm";
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
    import { t } from "$lib/i18n";

    interface Props {
        entry: ClassEntry;
        handler: EventHandler;
    }

    let { entry, handler }: Props = $props();
    const node = $derived(entry.node);
</script>

<Table>
    <TableHeader class="bg-background sticky top-0 z-10 shadow-lg">
        <TableRow>
            <TableHead>{$t("pane.class.methods.index")}</TableHead>
            <TableHead>{$t("pane.class.methods.modifiers")}</TableHead>
            <TableHead>{$t("pane.class.methods.name")}</TableHead>
            <TableHead>{$t("pane.class.methods.type")}</TableHead>
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
                            {mods || $t("pane.class.methods.none")}
                        </span>
                        ({method.access})
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                        {escapeLiteral(method.name.string)}
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                        {method.type.string}
                    </TableCell>
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
                            <DropdownMenuContent class="min-w-48" align="end">
                                <DropdownMenuItem
                                    class="justify-between"
                                    onclick={() => handler.open(memberEntry(entry, method), TabType.CODE)}
                                >
                                    {$t("pane.class.menu.disasm")}
                                    <Code size={16} />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    class="justify-between"
                                    onclick={() => handler.open(memberEntry(entry, method), TabType.GRAPH)}
                                >
                                    {$t("pane.class.menu.graph")}
                                    <GitBranchPlus size={16} />
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={5} class="h-24 text-center">{$t("pane.class.methods.no-methods")}</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
