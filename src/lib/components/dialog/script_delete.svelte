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

    interface Props {
        proto: ProtoScript | null;
        handler: EventHandler;
    }

    let { proto = $bindable(), handler }: Props = $props();

    const handle = async (accepted: boolean) => {
        if (accepted) {
            await handler.removeScript(proto!);
        }
        proto = null;
    };
</script>

<AlertDialog open={proto !== null} onOpenChange={() => (proto = null)} controlledOpen>
    <AlertDialogContent class="sm:max-w-[425px]">
        {#if proto}
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
        {/if}
    </AlertDialogContent>
</AlertDialog>
