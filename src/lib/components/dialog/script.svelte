<script lang="ts">
    import type { ProtoScript } from "$lib/script";
    import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import type { ModalProps } from "svelte-modals";

    interface Props extends ModalProps {
        proto: ProtoScript;
    }

    let { isOpen, close, proto }: Props = $props();
</script>

<Dialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <DialogContent class="flex flex-col sm:max-w-2xl">
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
        <textarea
            readonly
            class="bg-muted/40 h-64 resize-none rounded-md p-4 font-mono text-sm break-all"
            value={proto.url}
        ></textarea>
    </DialogContent>
</Dialog>
