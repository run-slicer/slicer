<script lang="ts">
    import type { Node } from "@run-slicer/asm";
    import { ElementType, formatMod } from "@run-slicer/asm/analysis/disasm";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();
</script>

<Table>
    <TableHeader>
        <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Modifiers</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
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
                </TableRow>
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={4} class="h-24 text-center">No methods.</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
