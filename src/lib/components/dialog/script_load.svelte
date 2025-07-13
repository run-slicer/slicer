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
    import type { EventHandler } from "$lib/event";
    import { Switch } from "$lib/components/ui/switch";
    import type { ModalProps } from "svelte-modals";

    interface Props extends ModalProps {
        handler: EventHandler;
    }

    let { isOpen, close, handler }: Props = $props();

    let value = $state("");
    let enabled = $state(true);
    let invalid = $state(false);
    const loadScript = async () => {
        const value0 = value.trim();
        if (!value0) {
            invalid = true;
            return;
        }

        isOpen = false;
        await handler.addScript(value0, enabled);
    };
</script>

<Dialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Import script</DialogTitle>
            <DialogDescription>Import a script from an arbitrary URL here.</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-2">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="url" class="text-right">URL</Label>
                <Input
                    id="url"
                    placeholder="https://..."
                    class={cn("col-span-3", !invalid || "border-destructive ring-offset-destructive")}
                    bind:value
                    onchange={() => (invalid = false)}
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="enabled" class="text-right">Enable</Label>
                <Switch id="enabled" class="col-span-3" bind:checked={enabled} />
            </div>
        </div>
        <DialogFooter>
            <Button type="submit" onclick={loadScript}>Import</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
