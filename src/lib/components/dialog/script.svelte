<script lang="ts">
    import type { ProtoScript } from "$lib/script";
    import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import type { ModalProps } from "svelte-modals";
    import { t } from "$lib/i18n";

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
                    {@html $t("dialog.script.desc", proto.id)}
                </DialogDescription>
            </DialogHeader>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{$t("dialog.script.table.id")}</TableHead>
                        <TableHead>{$t("dialog.script.table.name")}</TableHead>
                        <TableHead>{$t("dialog.script.table.desc")}</TableHead>
                        <TableHead>{$t("dialog.script.table.version")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell class="font-medium break-all">{proto.id}</TableCell>
                        <TableCell class="break-anywhere"
                            >{proto.script?.name || $t("dialog.script.table.unknown")}</TableCell
                        >
                        <TableCell class="break-anywhere"
                            >{proto.script?.description || $t("dialog.script.table.unknown")}</TableCell
                        >
                        <TableCell class="break-all"
                            >{proto.script?.version || $t("dialog.script.table.unknown")}</TableCell
                        >
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
