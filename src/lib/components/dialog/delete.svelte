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
    import { buttonVariants } from "$lib/components/ui/button";
    import { type ActionHandler, ActionType, type BulkEntryAction } from "$lib/action";
    import type { Entry } from "$lib/workspace";

    interface Props {
        entries: Entry[] | null;
        onaction?: ActionHandler;
    }

    let { entries = $bindable(), onaction }: Props = $props();

    const handle = (accepted: boolean) => {
        if (accepted) {
            onaction?.({ type: ActionType.REMOVE, entries: entries! } as BulkEntryAction);
        }
        entries = null;
    };
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
                <AlertDialogCancel onclick={() => handle(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction class={buttonVariants({ variant: "destructive" })} onclick={() => handle(true)}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        {/if}
    </AlertDialogContent>
</AlertDialog>
