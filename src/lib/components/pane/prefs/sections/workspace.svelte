<script lang="ts">
    import { encodings } from "$lib/workspace/encoding";
    import { capitalize } from "$lib/utils";
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { Alert, AlertTitle } from "$lib/components/ui/alert";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { CircleAlert, CircleQuestionMark } from "@lucide/svelte";
    import {
        workspaceEncoding,
        workspaceArchiveEncoding,
        workspaceArchiveDuplicateHandling,
        interpHexRowBytes,
    } from "$lib/state";
    import Section from "../section.svelte";
</script>

<Section id="workspace" label="Workspace">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="workspaceEncoding">File encoding</Label>
        <Select type="single" bind:value={$workspaceEncoding}>
            <SelectTrigger class="w-48">
                {encodings[$workspaceEncoding]?.label || $workspaceEncoding.toUpperCase()}
            </SelectTrigger>
            <SelectContent>
                {#each Object.values(encodings) as encoding}
                    <SelectItem value={encoding.id}>
                        {encoding.label || encoding.id.toUpperCase()}
                    </SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="workspaceArchiveEncoding">Archive encoding</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Default encoding for ZIP archive data.</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
        <Select type="single" bind:value={$workspaceArchiveEncoding}>
            <SelectTrigger class="w-48">
                {encodings[$workspaceArchiveEncoding]?.label || $workspaceArchiveEncoding.toUpperCase()}
            </SelectTrigger>
            <SelectContent>
                {#each Object.values(encodings) as encoding}
                    <SelectItem value={encoding.id}>
                        {encoding.label || encoding.id.toUpperCase()}
                    </SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="workspaceArchiveEncoding">Duplicate archive entry handling</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Determines how duplicate entries in archives are managed.</p>
                        <br />
                        <p>Skip: Ignores duplicates with nonsensical values.</p>
                        <p>Overwrite: Keeps only the last duplicate entry.</p>
                        <p>Rename: Renames duplicates to ensure uniqueness.</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
        <Select type="single" bind:value={$workspaceArchiveDuplicateHandling}>
            <SelectTrigger class="w-48">
                {capitalize($workspaceArchiveDuplicateHandling)}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="skip">Skip</SelectItem>
                <SelectItem value="overwrite">Overwrite</SelectItem>
                <SelectItem value="rename">Rename</SelectItem>
            </SelectContent>
        </Select>
    </div>

    <Section id="interp" label="Interpretation" small>
        <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Changes to these settings will cause all open entries to be reinterpreted!</AlertTitle>
        </Alert>
        <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
            <TooltipProvider>
                <div class="flex items-center gap-2">
                    <Label for="bytesPerRow">Bytes per row</Label>
                    <Tooltip>
                        <TooltipTrigger>
                            <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            Number of bytes displayed per row in the hexadecimal interpretation mode.
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
            <Input id="bytesPerRow" type="number" bind:value={$interpHexRowBytes} class="w-48" />
        </div>
    </Section>
</Section>
