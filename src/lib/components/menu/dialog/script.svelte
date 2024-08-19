<script lang="ts">
    import type { ProtoScript } from "$lib/script";
    import { Dialog, DialogHeader, DialogContent, DialogDescription, DialogTitle } from "$lib/components/ui/dialog";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

    export let proto: ProtoScript | null;
</script>

<Dialog open={proto !== null}>
    <DialogContent class="flex h-1/2 flex-col sm:max-w-2xl">
        {#if proto}
            <div class="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>{proto.script?.name || proto.id}</DialogTitle>
                    <DialogDescription>
                        Information about the <span class="italic">{proto.id}</span> script.
                    </DialogDescription>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Version</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell class="break-all font-medium">{proto.id}</TableCell>
                            <TableCell class="break-all">{proto.script?.name || "<unknown>"}</TableCell>
                            <TableCell class="break-all">{proto.script?.description || "<unknown>"}</TableCell>
                            <TableCell class="break-all">{proto.script?.version || "<unknown>"}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <pre
                class="grow overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted/40 p-4 font-mono text-sm">{proto.url}</pre>
        {/if}
    </DialogContent>
</Dialog>
