<script lang="ts">
    import type { SlurpEntry } from "$lib/hprof/reader";
    import { createTable, Render, Subscribe } from "svelte-headless-table";
    import { addPagination, addSortBy } from "svelte-headless-table/plugins";
    import { humanSize } from "$lib/utils";
    import type { Readable } from "svelte/store";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-svelte";

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
            accessor: ({ name }) => name || "<unknown>",
            header: "Name",
        }),
    ]);

    const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } = table.createViewModel(columns);
    const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
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
                                    <TableHead {...attrs}>
                                        <Button variant="ghost" on:click={props.sort.toggle}>
                                            <Render of={cell.render()} />
                                            <ArrowUpDown class="ml-2 h-4 w-4" />
                                        </Button>
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
                                    <TableCell {...attrs}>
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
