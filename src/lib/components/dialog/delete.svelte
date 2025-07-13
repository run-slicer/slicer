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
    import type { ModalProps } from "svelte-modals";

    interface Props extends ModalProps {
        entries: Entry[];
        handler: EventHandler;
    }

    let { isOpen, close, entries, handler }: Props = $props();

    const handle = async (accepted: boolean) => {
        isOpen = false;
        if (accepted) {
            await handler.remove(entries!);
        }
    };
</script>

<AlertDialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <AlertDialogContent class="sm:max-w-[425px]">
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
    </AlertDialogContent>
</AlertDialog>
