<script lang="ts">
    import type { SlurpEntry } from "$lib/hprof/reader";
    import { createTable, Render, Subscribe } from "svelte-headless-table";
    import { addPagination, addSortBy } from "svelte-headless-table/plugins";
    import { humanSize, prettyJavaType } from "$lib/utils";
    import type { Readable } from "svelte/store";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-svelte";
    import { cn } from "$lib/components/utils";

    export let entries: Readable<SlurpEntry[]>;

    const table = createTable(entries, {
        page: addPagination(),
        sort: addSortBy(),
    });
    const columns = table.createColumns([
        table.column({
            accessor: "totalSize",
            header: "Total size",
            cell: ({ value }) => humanSize(value),
        }),
        table.column({
            accessor: "count",
            header: "Instances",
        }),
        table.column({
            accessor: "largestSize",
            header: "Largest",
            cell: ({ value }) => humanSize(value),
        }),
        table.column({
            accessor: "name",
            header: "Name",
            cell: ({ value }) => (value ? prettyJavaType(value) : "<unknown>"),
            plugins: {
                sort: {
                    disable: true,
                },
            },
        }),
    ]);

    const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } = table.createViewModel(columns);
    const { hasNextPage, hasPreviousPage, pageSize, pageIndex } = pluginStates.page;
</script>

<div>
    <div class="rounded-md border">
        <Table {...$tableAttrs}>
            <TableHeader>
                {#each $headerRows as headerRow}
                    <Subscribe rowAttrs={headerRow.attrs()}>
                        <TableRow>
                            {#each headerRow.cells as cell (cell.id)}
                                <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
                                    <TableHead class="whitespace-nowrap" {...attrs}>
                                        <div class="flex flex-row items-center">
                                            <Render of={cell.render()} />
                                            {#if cell.id !== "name"}
                                                <button
                                                    type="button"
                                                    aria-label="Toggle ordering"
                                                    class="ml-2 cursor-pointer hover:text-accent-foreground"
                                                    on:click={props.sort.toggle}
                                                >
                                                    <ArrowUpDown size={16} />
                                                </button>
                                            {/if}
                                        </div>
                                    </TableHead>
                                </Subscribe>
                            {/each}
                        </TableRow>
                    </Subscribe>
                {/each}
            </TableHeader>
            <TableBody {...$tableBodyAttrs}>
                {#each $pageRows as row (row.id)}
                    <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
                        <TableRow {...rowAttrs}>
                            {#each row.cells as cell (cell.id)}
                                <Subscribe attrs={cell.attrs()} let:attrs>
                                    <TableCell
                                        class={cn("break-anywhere", cell.id !== "name" || "font-mono tracking-tight")}
                                        {...attrs}
                                    >
                                        <Render of={cell.render()} />
                                    </TableCell>
                                </Subscribe>
                            {/each}
                        </TableRow>
                    </Subscribe>
                {/each}
            </TableBody>
        </Table>
    </div>
    <div class="flex items-center justify-end space-x-4 py-4">
        <div class="text-sm text-muted-foreground">
            {$pageSize * $pageIndex + 1}-{$pageSize * ($pageIndex + 1)} of {$entries.length} items
        </div>
        <Button
            variant="outline"
            size="icon"
            on:click={() => ($pageIndex = $pageIndex - 1)}
            disabled={!$hasPreviousPage}
        >
            <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" disabled={!$hasNextPage} on:click={() => ($pageIndex = $pageIndex + 1)}>
            <ChevronRight class="h-4 w-4" />
        </Button>
    </div>
</div>
