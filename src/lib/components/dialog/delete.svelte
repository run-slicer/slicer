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
    import { t } from "$lib/i18n";

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
            <AlertDialogTitle>{$t("dialog.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
                {@html entries.length === 1
                    ? $t("dialog.delete.desc.single", entries[0].name)
                    : $t("dialog.delete.desc.multiple", entries.length)}
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel onclick={() => handle(false)}>{$t("dialog.delete.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "destructive" })} onclick={() => handle(true)}>
                {$t("dialog.delete.action.confirm")}
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
