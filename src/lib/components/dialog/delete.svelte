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
    import { createEventDispatcher } from "svelte";
    import { ActionType } from "$lib/action";
    import type { Entry } from "$lib/workspace";

    export let entries: Entry[] | null;

    const handle = (accepted: boolean) => {
        if (accepted) {
            dispatch("action", { type: ActionType.REMOVE, entries: entries! });
        }
        entries = null;
    };

    const dispatch = createEventDispatcher();
</script>

<AlertDialog open={entries !== null}>
    <AlertDialogContent class="sm:max-w-[425px]">
        {#if entries}
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure, absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete
                    <span class="break-all italic">
                        {#if entries.length === 1}
                            {entries[0].name}
                        {:else}
                            {entries.length} entries
                        {/if}
                    </span>
                    from the workspace.
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
