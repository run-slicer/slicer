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
    import type { ProtoScript } from "$lib/script";
    import type { EventHandler } from "$lib/event";
    import type { ModalProps } from "svelte-modals";

    interface Props extends ModalProps {
        proto: ProtoScript;
        handler: EventHandler;
    }

    let { isOpen, close, proto, handler }: Props = $props();

    const handle = async (accepted: boolean) => {
        isOpen = false;
        if (accepted) {
            await handler.removeScript(proto!);
        }
    };
</script>

<AlertDialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <AlertDialogContent class="sm:max-w-[425px]">
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure, absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the
                <span class="break-all italic">{proto.id}</span> script.
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
