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
    import { loadExternally } from "$lib/workspace";
    import type { ModalProps } from "svelte-modals";

    let { isOpen, close }: ModalProps = $props();

    let value = $state("");
    let invalid = $state(false);
    const loadFile = async () => {
        const value0 = value.trim();
        if (!value0) {
            invalid = true;
            return;
        }

        isOpen = false;
        loadExternally(value0)
    };
</script>

<Dialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Open File Externally</DialogTitle>
            <DialogDescription>
                Import a file from an arbitrary URL here.
            </DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-6 items-center gap-4">
            <Label for="name" class="text-right">
                URL
            </Label>
            <Input
                id="name"
                placeholder="https://..."
                class={cn(
                    "col-span-5",
                    !invalid ||
                        "border-destructive ring-offset-destructive"
                )}
                bind:value
                onchange={() => (invalid = false)}
            />
        </div>
        <DialogFooter>
            <Button type="submit" onclick={loadFile}>
                Import
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
