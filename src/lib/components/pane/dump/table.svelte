<script lang="ts">
    import type { Entry } from "@run-slicer/hprof/slurp";
    import { createTable, Render, Subscribe } from "svelte-headless-table";
    import { humanSize } from "$lib/utils";
    import type { Readable } from "svelte/store";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

    export let entries: Readable<Entry[]>;

    const table = createTable(entries);
    const columns = table.createColumns([
        table.column({
            accessor: ({ totalSize }) => humanSize(totalSize),
            header: "Total size",
        }),
        table.column({
            accessor: "count",
            header: "Instances",
        }),
        table.column({
            accessor: ({ largestSize }) => humanSize(largestSize),
            header: "Largest",
        }),
        table.column({
            accessor: ({ name }) => name || "<unknown>",
            header: "Name",
        }),
    ]);

    const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns);
</script>

<div class="rounded-md border">
    <Table {...$tableAttrs}>
        <TableHeader>
            {#each $headerRows as headerRow}
                <Subscribe rowAttrs={headerRow.attrs()}>
                    <TableRow>
                        {#each headerRow.cells as cell (cell.id)}
                            <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                                <TableHead {...attrs}>
                                    <Render of={cell.render()} />
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
