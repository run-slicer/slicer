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
    import type { EventHandler } from "$lib/event";
    import type { ModalProps } from "svelte-modals";

    interface Props extends ModalProps {
        handler: EventHandler;
    }

    let { isOpen, close, handler }: Props = $props();
    const handle = async () => {
        isOpen = false;
        await handler.clear();
    };
</script>

<AlertDialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <AlertDialogContent class="sm:max-w-[425px]">
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure, absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete all entries from the workspace.
                <p class="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "destructive" })} onclick={handle}>
                Delete
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
