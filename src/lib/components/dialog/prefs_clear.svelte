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
    import type { ModalProps } from "svelte-modals";
    import { clear } from "$lib/state";
    import { t } from "$lib/i18n";

    let { isOpen, close }: ModalProps = $props();
    const handle = async () => {
        isOpen = false;
        clear();
    };
</script>

<AlertDialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <AlertDialogContent class="sm:max-w-[425px]">
        <AlertDialogHeader>
            <AlertDialogTitle>{$t("dialog.prefs-clear.title")}</AlertDialogTitle>
            <AlertDialogDescription>
                {@html $t("dialog.prefs-clear.desc")}
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>{$t("dialog.prefs-clear.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction class={buttonVariants({ variant: "destructive" })} onclick={handle}>
                {$t("dialog.prefs-clear.action.confirm")}
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
