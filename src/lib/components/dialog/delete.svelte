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
    import type { Entry } from "$lib/workspace";
    import type { EventHandler } from "$lib/event";

    interface Props {
        entries: Entry[] | null;
        handler: EventHandler;
    }

    let { entries = $bindable(), handler }: Props = $props();

    const handle = async (accepted: boolean) => {
        if (accepted) {
            await handler.remove(entries!);
        }
        entries = null;
    };
</script>

<AlertDialog open={entries !== null} onOpenChange={() => (entries = null)} controlledOpen>
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
