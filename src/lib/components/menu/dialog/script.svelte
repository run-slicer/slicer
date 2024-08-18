<script lang="ts">
    import type { ProtoScript } from "$lib/script";
    import { Dialog, DialogHeader, DialogContent, DialogDescription, DialogTitle } from "$lib/components/ui/dialog";

    export let proto: ProtoScript | null;
</script>

<Dialog open={proto !== null}>
    <DialogContent>
        {#if proto}
            <DialogHeader>
                <DialogTitle>{proto.script?.name || proto.id}</DialogTitle>
                <DialogDescription>
                    Information about the <span class="italic">{proto.id}</span> script.
                </DialogDescription>
            </DialogHeader>
        {/if}
    </DialogContent>
</Dialog>
