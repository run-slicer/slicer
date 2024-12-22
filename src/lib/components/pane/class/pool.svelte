<script lang="ts">
    import type { Node } from "@run-slicer/asm";
    import { ConstantType } from "@run-slicer/asm/spec";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import { formatEntry } from "@run-slicer/asm/analysis/disasm";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();
</script>

<Table>
    <TableHeader>
        <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#each node.pool as entry, i (i)}
            {#if entry}
                <TableRow>
                    <TableCell class="font-medium">{i}</TableCell>
                    <TableCell>
                        <span class="font-mono tracking-tight">{ConstantType[entry.type] || "<unknown>"}</span>
                        ({entry.type})
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">
                        {formatEntry(entry, node.pool)}
                    </TableCell>
                </TableRow>
            {/if}
        {/each}
    </TableBody>
</Table>
