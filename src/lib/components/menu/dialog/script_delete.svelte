<script lang="ts">
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import { type ProtoScript, remove } from "$lib/script";

    export let proto: ProtoScript | null = null;

    const handle = async (accepted: boolean) => {
        if (accepted) {
            await remove(proto!);
        }
        proto = null;
    };
</script>

<AlertDialog open={proto !== null}>
    <AlertDialogContent class="sm:max-w-[425px]">
        {#if proto}
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure, absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the
                    <span class="break-all italic">{proto.id}</span> script.
                    <p class="mt-2 font-semibold">This action cannot be undone.</p>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel on:click={() => handle(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild let:builder>
                    <Button builders={[builder]} variant="destructive" on:click={() => handle(true)}>Delete</Button>
                </AlertDialogAction>
            </AlertDialogFooter>
        {/if}
    </AlertDialogContent>
</AlertDialog>
