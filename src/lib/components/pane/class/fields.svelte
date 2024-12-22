<script lang="ts">
    import type { Node } from "@run-slicer/asm";
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
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#if node.fields.length > 0}
            {#each node.fields as field, i (i)}
                <TableRow>
                    <TableCell class="font-medium">{i}</TableCell>
                    <TableCell>{field.access}</TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">{field.type.decode()}</TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight">{field.name.decode()}</TableCell>
                </TableRow>
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={4} class="h-24 text-center">No fields.</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
