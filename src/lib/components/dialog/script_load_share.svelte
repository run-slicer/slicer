<script lang="ts">
    import {
        AlertDialog,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
        AlertDialogAction,
        AlertDialogCancel,
    } from "$lib/components/ui/alert-dialog";
    import type { EventHandler } from "$lib/event";
    import { truncate } from "$lib/utils";
    import { buttonVariants } from "$lib/components/ui/button";
    import type { ModalProps } from "svelte-modals";

    interface Props extends ModalProps {
        url: string;
        handler: EventHandler;
    }

    let { isOpen, close, url, handler }: Props = $props();

    const handle = async (accepted: boolean, enabled: boolean) => {
        isOpen = false;
        if (accepted) {
            await handler.addScript(url, enabled);
        }
    };
</script>

<AlertDialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Import script</AlertDialogTitle>
            <AlertDialogDescription>
                Import a script from
                <span class="p-0.5 font-mono text-xs" title={url}>
                    {truncate(url, 120)}
                </span>?
                <p class="mt-2 font-semibold">
                    Scripts have <span class="text-destructive">full access</span> to slicer, be aware of what you import!
                </p>
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onclick={() => handle(false, false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "secondary" })} onclick={() => handle(true, false)}>
                Import
            </AlertDialogAction>
            <AlertDialogAction onclick={() => handle(true, true)}>Import & enable</AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
