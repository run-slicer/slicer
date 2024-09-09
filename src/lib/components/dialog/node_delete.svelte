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
    import type { Node } from "$lib/components/pane/tree";
    import { createEventDispatcher } from "svelte";

    export let data: Node | null;

    const handle = (accepted: boolean) => {
        if (accepted) {
            dispatch("delete", { data: data! });
        }
        data = null;
    };

    const dispatch = createEventDispatcher();
</script>

<AlertDialog open={data !== null}>
    <AlertDialogContent class="sm:max-w-[425px]">
        {#if data}
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure, absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete
                    <span class="break-all italic">{data.label}</span> from the workspace.
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
