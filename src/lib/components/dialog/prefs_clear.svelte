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

    interface Props {
        open?: boolean;
        handler: EventHandler;
    }

    let { open = $bindable(false) }: Props = $props();
    const handle = async () => {
        open = false;
        // await onaction?.({ type: ActionType.PREFS_CLEAR });
    };
</script>

<AlertDialog bind:open>
    <AlertDialogContent class="sm:max-w-[425px]">
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure, absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will reset <span class="font-semibold">all preferences</span>, including scripts.
                <p class="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "destructive" })} onclick={handle}>
                Reset
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
