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
    import { Button } from "$lib/components/ui/button";
    import type { ModalProps } from "svelte-modals";
    import type { EventHandler } from "$lib/event";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
    import { MappingFormat } from "$lib/mapping";
    import { cn } from "../utils";
    import Badge from "../ui/badge/badge.svelte";

    interface Props extends ModalProps {
        detectedFormat: MappingFormat | null;
        content: string
        handler: EventHandler;
    }

    const displayNames: Record<keyof typeof MappingFormat, string> = {
        SRG_XSRG: "SRG/XSRG",
        CSRG_TSRG: "CSRG/TSRG",
        TSRG2: "TSRG v2",
        PG: "ProGuard",
        TINY1: "Tiny v1",
        TINY2: "Tiny v2",
    };
    const formats = Object.keys(MappingFormat) as (keyof typeof MappingFormat)[];

    let { isOpen, close, detectedFormat, content, handler }: Props = $props();

    let value = $state(detectedFormat?.toString() ?? "");
    let invalid = $state(false);
    const load = async () => {
        if (!value || !(value.trim().length > 0)) {
            invalid = true;
            return;
        }

        isOpen = false;

        await handler.applyMappings(content, value as MappingFormat)
    };

    const triggerContent = $derived(
        value && value.trim().length > 0
            ? displayNames[value as keyof typeof MappingFormat]
            : "Select a mapping format..."
    );

</script>

<Dialog bind:open={isOpen} onOpenChangeComplete={(open) => open || close()}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Load Mappings</DialogTitle>
            <DialogDescription>Please select from the dropdown the mappings format.</DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-6 items-center gap-4">
            <Label for="format" class="text-right">Format</Label>

            <Select type="single" bind:value onValueChange={() => (invalid = false)}>
                <SelectTrigger
                    id="format"
                    class={cn("col-span-5 w-full", !invalid || "border-destructive ring-offset-destructive")}
                >
                    {triggerContent}
                </SelectTrigger>
                <SelectContent>
                    {#each formats as format}
                        <SelectItem defaultSelected value={format}>
                            <div class="flex flex-row gap-2 items-center justify-center">
                                {displayNames[format]}
                                {#if detectedFormat === format}
                                    <Badge variant="outline">Detected</Badge>
                                {/if}
                            </div>
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
            <Button type="submit" onclick={load}>Import</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
