<script lang="ts">
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/components/utils";
    import type { ModalProps } from "svelte-modals";
    import type { EventHandler } from "$lib/event";
    import { t } from "$lib/i18n";

    interface Props extends ModalProps {
        handler: EventHandler;
    }

    let { isOpen, close, handler }: Props = $props();

    let value = $state("");
    let invalid = $state(false);
    const loadFile = async () => {
        const value0 = value.trim();
        if (!value0) {
            invalid = true;
            return;
        }

        isOpen = false;
        await handler.addRemote(value0);
    };
</script>

<Dialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>{$t("dialog.load-external.title")}</DialogTitle>
            <DialogDescription>
                {@html $t("dialog.load-external.desc")}
            </DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-6 items-center gap-4">
            <Label for="name" class="text-right">{$t("dialog.load-external.url")}</Label>
            <Input
                id="name"
                placeholder="https://..."
                class={cn("col-span-5", !invalid || "border-destructive ring-offset-destructive")}
                bind:value
                onchange={() => (invalid = false)}
            />
        </div>
        <DialogFooter>
            <Button type="submit" onclick={loadFile}>
                {$t("dialog.load-external.action.confirm")}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
