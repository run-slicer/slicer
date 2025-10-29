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
    import { t } from "$lib/i18n";

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
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>{$t("dialog.script-delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
                {@html $t("dialog.script-delete.desc", proto.id)}
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onclick={() => handle(false)}>
                {$t("dialog.script-delete.action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "destructive" })} onclick={() => handle(true)}>
                {$t("dialog.script-delete.action.confirm")}
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
