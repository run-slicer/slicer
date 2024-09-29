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

    export let open = false;

    const dispatch = createEventDispatcher();
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
            <AlertDialogAction asChild let:builder>
                <Button
                    builders={[builder]}
                    variant="destructive"
                    on:click={() => dispatch("action", { type: ActionType.PREFS_CLEAR })}>Reset</Button
                >
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
