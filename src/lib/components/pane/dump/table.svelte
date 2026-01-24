<script lang="ts" module>
    import type { SortDirection } from "@tanstack/table-core";

    const directions = [false, "desc", "asc"];

    export const nextDirection = (dir: false | SortDirection): boolean | undefined => {
        let index = directions.indexOf(dir) + 1;
        if (directions.length === index) {
            index = 0; // wrap around
        }

        return index > 0 ? directions[index] === "desc" : undefined;
    };
</script>

<script lang="ts">
    import type { SlurpEntry } from "$lib/reader/hprof";
    import { humanSize, prettyJavaType } from "$lib/utils";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { ChevronLeft, ChevronRight } from "@lucide/svelte";
    import { cn } from "$lib/components/utils";
    import { createSvelteTable, FlexRender, renderComponent } from "$lib/components/ui/data-table";
    import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "$lib/components/ui/table";
    import type { HTMLAttributes } from "svelte/elements";
    import TableHeaderComponent from "./table-header.svelte";
    import TableCellComponent from "./table-cell.svelte";
    import {
        type ColumnDef,
        type PaginationState,
        type SortingState,
        type ColumnFiltersState,
        getCoreRowModel,
        getPaginationRowModel,
        getSortedRowModel,
        getFilteredRowModel,
    } from "@tanstack/table-core";
    import { t } from "$lib/i18n";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        entries: SlurpEntry[];
    }

    let { entries, ...rest }: Props = $props();

    let columnFilters = $state<ColumnFiltersState>([]);
    let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 20 });
    let sorting = $state<SortingState>([
        { id: "totalSize", desc: true }, // descending by total size by default
    ]);

    let { pageIndex, pageSize } = $derived(pagination);

    const columns: ColumnDef<SlurpEntry>[] = [
        {
            accessorKey: "totalSize",
            header: ({ column }) =>
                renderComponent(TableHeaderComponent, {
                    text: $t("pane.dump.table.total-size"),
                    order: column.getIsSorted() || undefined,
                    onclick: () => column.toggleSorting(nextDirection(column.getIsSorted())),
                }),
            enableColumnFilter: false,
            cell: ({ row }) => humanSize(row.getValue("totalSize")),
        },
        {
            accessorKey: "count",
            header: ({ column }) =>
                renderComponent(TableHeaderComponent, {
                    text: $t("pane.dump.table.instances"),
                    order: column.getIsSorted() || undefined,
                    onclick: () => column.toggleSorting(nextDirection(column.getIsSorted())),
                }),
            enableColumnFilter: false,
        },
        {
            accessorKey: "largestSize",
            header: ({ column }) =>
                renderComponent(TableHeaderComponent, {
                    text: $t("pane.dump.table.largest-size"),
                    order: column.getIsSorted() || undefined,
                    onclick: () => column.toggleSorting(nextDirection(column.getIsSorted())),
                }),
            enableColumnFilter: false,
            cell: ({ row }) => humanSize(row.getValue("largestSize")),
        },
        {
            id: "name",
            accessorFn: ({ name }) => (name ? prettyJavaType(name) : "<unknown>"),
            header: ({ column }) =>
                renderComponent(TableHeaderComponent, {
                    text: $t("pane.dump.table.name"),
                    order: column.getIsSorted() || undefined,
                    onclick: () => column.toggleSorting(nextDirection(column.getIsSorted())),
                }),
            cell: ({ row }) =>
                renderComponent(TableCellComponent, {
                    text: row.getValue("name") as string,
                    mono: true,
                }),
            filterFn: "includesString",
        },
    ];

    const table = createSvelteTable({
        get data() {
            return entries;
        },
        columns,
        state: {
            get pagination() {
                return pagination;
            },
            get sorting() {
                return sorting;
            },
            get columnFilters() {
                return columnFilters;
            },
        },
        onSortingChange: (updater) => {
            if (typeof updater === "function") {
                sorting = updater(sorting);
            } else {
                sorting = updater;
            }
        },
        onPaginationChange: (updater) => {
            if (typeof updater === "function") {
                pagination = updater(pagination);
            } else {
                pagination = updater;
            }
        },
        onColumnFiltersChange: (updater) => {
            if (typeof updater === "function") {
                columnFilters = updater(columnFilters);
            } else {
                columnFilters = updater;
            }
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });
</script>

<div {...rest} class={cn("flex flex-col", rest.class)}>
    <div class="flex items-center justify-between pb-2">
        <Input
            class="max-w-sm"
            placeholder={$t("pane.dump.table.filter.placeholder")}
            type="text"
            value={table.getColumn("name")?.getFilterValue() ?? ""}
            onchange={(e) => {
                table.getColumn("name")?.setFilterValue(e.currentTarget.value);
            }}
            oninput={(e) => {
                table.getColumn("name")?.setFilterValue(e.currentTarget.value);
            }}
        />
        <div class="flex items-center space-x-4">
            <div class="text-muted-foreground text-sm">
                {$t("pane.dump.table.page", pageSize * pageIndex + 1, pageSize * (pageIndex + 1), entries.length)}
            </div>
            <Button
                variant="outline"
                size="icon"
                onclick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onclick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight />
            </Button>
        </div>
    </div>
    <div class="no-overflow overflow-y-auto rounded-md border">
        <Table>
            <TableHeader class="sticky top-0 shadow-lg">
                {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
                    <TableRow>
                        {#each headerGroup.headers as header (header.id)}
                            <TableHead class="bg-background whitespace-nowrap brightness-125">
                                {#if !header.isPlaceholder}
                                    <FlexRender
                                        content={header.column.columnDef.header}
                                        context={header.getContext()}
                                    />
                                {/if}
                            </TableHead>
                        {/each}
                    </TableRow>
                {/each}
            </TableHeader>
            <TableBody>
                {#each table.getRowModel().rows as row (row.id)}
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                        {#each row.getVisibleCells() as cell (cell.id)}
                            <TableCell class="break-anywhere whitespace-normal">
                                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                            </TableCell>
                        {/each}
                    </TableRow>
                {:else}
                    <TableRow>
                        <TableCell colspan={columns.length} class="h-24 text-center">
                            {$t("pane.dump.table.filter.no-results")}
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>

<style>
    /* unset overflow on table wrapper */
    .no-overflow :global(:has(> table)) {
        overflow: unset;
    }
</style>
