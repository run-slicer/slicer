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

    interface Props {
        open?: boolean;
        handler: EventHandler;
    }

    let { open = $bindable(false), handler }: Props = $props();

    let value = $state("");
    $effect(() => {
        if (!open) {
            // clear after closing
            value = "";
        }
    });

    let invalid = $state(false);
    const loadScript = async () => {
        const value0 = value.trim();
        if (!value0) {
            invalid = true;
            return;
        }

        open = false;
        await handler.addScript(value0);
    };
</script>

<Dialog bind:open>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Import script</DialogTitle>
            <DialogDescription>
                Import a script from an arbitrary URL here.
                <p class="italic text-destructive">Scripts have full access to slicer, be aware of what you import!</p>
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
            <Button type="submit" onclick={loadScript}>Import</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
