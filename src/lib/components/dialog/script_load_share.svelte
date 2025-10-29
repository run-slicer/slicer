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
    import { t } from "$lib/i18n";

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
            <AlertDialogTitle>{$t("dialog.script-load-share.title")}</AlertDialogTitle>
            <AlertDialogDescription>
                {@html $t("dialog.script-load-share.title", url, truncate(url, 120))}
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onclick={() => handle(false, false)}>
                {$t("dialog.script-load-share.action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "secondary" })} onclick={() => handle(true, false)}>
                {$t("dialog.script-load-share.action.confirm.secondary")}
            </AlertDialogAction>
            <AlertDialogAction onclick={() => handle(true, true)}>
                {$t("dialog.script-load-share.action.confirm")}
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
