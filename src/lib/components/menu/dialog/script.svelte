<script lang="ts">
    import { addToast } from "$lib/components/toaster.svelte";
    import { load, read, scripts, ScriptState, unload } from "$lib/script";
    import { Dialog, DialogHeader, DialogContent, DialogDescription, DialogTitle } from "$lib/components/ui/dialog";
    import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "$lib/components/ui/table";
    import { Switch } from "$lib/components/ui/switch";
    import { Button } from "$lib/components/ui/button";
    import { Clipboard, Globe } from "lucide-svelte";

    export let open = false;

    const loadClipboard = async () => {
        if (!navigator.clipboard) {
            addToast({
                title: "Error occurred",
                description: `Could not copy from clipboard, feature not available.`,
                variant: "destructive",
            });
            return;
        }

        try {
            const data = await navigator.clipboard.readText();

            await read(`data:text/javascript;base64,${window.btoa(data)}`);
        } catch (e) {
            addToast({
                title: "Error occurred",
                description: `Could not copy from clipboard, access denied.`,
                variant: "destructive",
            });
        }
    };
</script>

<Dialog bind:open>
    <DialogContent class="max-w-2xl">
        <div class="flex flex-row justify-between">
            <DialogHeader>
                <DialogTitle>Scripts</DialogTitle>
                <DialogDescription>Manipulate with scripts here.</DialogDescription>
            </DialogHeader>
            <div class="mt-6">
                <Button variant="outline" on:click={loadClipboard}>
                    <Clipboard class="mr-2 h-4 w-4" /> Clipboard
                </Button>
                <Button variant="outline" disabled>
                    <Globe class="mr-2 h-4 w-4" /> URL
                </Button>
            </div>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each $scripts as proto (proto.id)}
                    {@const id = proto.script?.id || proto.id}
                    {@const name = proto.script ? proto.script.name || proto.script.id : proto.id}
                    <TableRow>
                        <TableCell class="font-medium">{id}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{proto.script?.version || "unknown"}</TableCell>
                        <TableCell>
                            <Switch
                                checked={proto.state === ScriptState.LOADED}
                                disabled={proto.state === ScriptState.FAILED}
                                onCheckedChange={(checked) => (checked ? load : unload)(proto)}
                            />
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </DialogContent>
</Dialog>
