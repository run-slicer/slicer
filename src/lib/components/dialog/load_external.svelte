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
            <DialogTitle>Add remote file</DialogTitle>
            <DialogDescription>
                Import a file from an arbitrary URL here.
                <p class="mt-2 italic">The serving HTTP server has to have CORS enabled for this to work.</p>
            </DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-6 items-center gap-4">
            <Label for="name" class="text-right">URL</Label>
            <Input
                id="name"
                placeholder="https://..."
                class={cn("col-span-5", !invalid || "border-destructive ring-offset-destructive")}
                bind:value
                onchange={() => (invalid = false)}
            />
        </div>
        <DialogFooter>
            <Button type="submit" onclick={loadFile}>Import</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
