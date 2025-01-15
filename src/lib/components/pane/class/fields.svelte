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
    <TableHeader class="sticky top-0 z-10 bg-background shadow-lg">
        <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Modifiers</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#if node.fields.length > 0}
            {#each node.fields as field, i (i)}
                {@const mods = formatMod(field.access, ElementType.FIELD)}
                <TableRow>
                    <TableCell class="font-medium">{i}</TableCell>
                    <TableCell>
                        <span class="break-anywhere font-mono tracking-tight">
                            {mods || "<none>"}
                        </span>
                        ({field.access})
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">{field.type.string}</TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">{field.name.string}</TableCell>
                </TableRow>
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={4} class="h-24 text-center">No fields.</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
