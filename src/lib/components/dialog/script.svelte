<script lang="ts">
    import type { ProtoScript } from "$lib/script";
    import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

    interface Props {
        proto: ProtoScript | null;
    }

    let { proto = $bindable(null) }: Props = $props();
</script>

<Dialog open={proto !== null} onOpenChange={() => (proto = null)}>
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
                            <TableCell class="font-medium break-all">{proto.id}</TableCell>
                            <TableCell class="break-anywhere">{proto.script?.name || "<unknown>"}</TableCell>
                            <TableCell class="break-anywhere">{proto.script?.description || "<unknown>"}</TableCell>
                            <TableCell class="break-all">{proto.script?.version || "<unknown>"}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            <pre
                class="bg-muted/40 grow overflow-auto rounded-md p-4 font-mono text-sm break-all whitespace-pre-wrap">{proto.url}</pre>
        {/if}
    </DialogContent>
</Dialog>
