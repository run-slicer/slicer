<script lang="ts">
    import { encodings } from "$lib/workspace/encoding";
    import { capitalize } from "$lib/utils";
    import { Alert, AlertTitle } from "$lib/components/ui/alert";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import { CircleAlert } from "@lucide/svelte";
    import {
        workspaceEncoding,
        workspaceArchiveEncoding,
        workspaceArchiveDuplicateHandling,
        interpHexRowBytes,
    } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
</script>

<Section id="workspace" label="Workspace">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="workspaceEncoding" text="File encoding" />
        <Select type="single" bind:value={$workspaceEncoding}>
            <SelectTrigger id="workspaceEncoding" class="w-48">
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
        <Label for="workspaceArchiveEncoding" text="Archive encoding">Default encoding for ZIP archive data.</Label>
        <Select type="single" bind:value={$workspaceArchiveEncoding}>
            <SelectTrigger id="workspaceArchiveEncoding" class="w-48">
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
        <Label for="workspaceArchiveDuplicateHandling" text="Duplicate archive entry handling">
            <p>Determines how duplicate entries in archives are managed.</p>
            <br />
            <p>Skip: Ignores duplicates with nonsensical values.</p>
            <p>Overwrite: Keeps only the last duplicate entry.</p>
            <p>Rename: Renames duplicates to ensure uniqueness.</p>
        </Label>
        <Select type="single" bind:value={$workspaceArchiveDuplicateHandling}>
            <SelectTrigger id="workspaceArchiveDuplicateHandling" class="w-48">
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
            <Label for="bytesPerRow" text="Bytes per row">
                Number of bytes displayed per row in the hexadecimal interpretation mode.
            </Label>
            <Input id="bytesPerRow" type="number" bind:value={$interpHexRowBytes} class="w-48" />
        </div>
    </Section>
</Section>
