<script lang="ts">
    import type { Node } from "@katana-project/asm";
    import { ConstantType } from "@katana-project/asm/spec";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import { formatEntry } from "@katana-project/asm/analysis/disasm";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();
</script>

<Table>
    <TableHeader class="bg-background sticky top-0 z-10 shadow-lg">
        <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#if node.pool.length > 0}
            {#each node.pool as entry, i (i)}
                {#if entry}
                    <TableRow>
                        <TableCell class="font-medium">{i}</TableCell>
                        <TableCell>
                            <span class="font-mono tracking-tight">{ConstantType[entry.type] || "<unknown>"}</span>
                            ({entry.type})
                        </TableCell>
                        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                            {formatEntry(entry, node.pool)}
                        </TableCell>
                    </TableRow>
                {/if}
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={3} class="h-24 text-center">No constant pool entries.</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
