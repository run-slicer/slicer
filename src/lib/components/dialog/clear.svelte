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
    import { type ActionHandler, ActionType } from "$lib/action";

    interface Props {
        open?: boolean;
        onaction?: ActionHandler;
    }

    let { open = $bindable(false), onaction }: Props = $props();
    const handle = () => {
        open = false;
        onaction?.({ type: ActionType.CLEAR });
    };
</script>

<AlertDialog bind:open>
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
