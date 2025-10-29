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
    import { t } from "$lib/i18n";
</script>

<Section id="workspace" labelKey="pane.prefs.section.workspace">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="workspaceEncoding" textKey="pane.prefs.workspace.file-encoding" />
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
        <Label
            for="workspaceArchiveEncoding"
            textKey="pane.prefs.workspace.archive-encoding"
            descKey="pane.prefs.workspace.archive-encoding.desc"
        />
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
        <Label
            for="workspaceArchiveDuplicateHandling"
            textKey="pane.prefs.workspace.duplicate-handling"
            descKey="pane.prefs.workspace.duplicate-handling.desc"
        />
        <Select type="single" bind:value={$workspaceArchiveDuplicateHandling}>
            <SelectTrigger id="workspaceArchiveDuplicateHandling" class="w-48">
                {capitalize($workspaceArchiveDuplicateHandling)}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="skip">{$t("pane.prefs.workspace.duplicate-handling.skip")}</SelectItem>
                <SelectItem value="overwrite">{$t("pane.prefs.workspace.duplicate-handling.overwrite")}</SelectItem>
                <SelectItem value="rename">{$t("pane.prefs.workspace.duplicate-handling.rename")}</SelectItem>
            </SelectContent>
        </Select>
    </div>

    <Section id="interp" labelKey="pane.prefs.section.interpretation" small>
        <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{$t("pane.prefs.workspace.interp.alert")}</AlertTitle>
        </Alert>
        <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
            <Label
                for="bytesPerRow"
                textKey="pane.prefs.workspace.interp.bytes-per-row"
                descKey="pane.prefs.workspace.interp.bytes-per-row.desc"
            />
            <Input id="bytesPerRow" type="number" bind:value={$interpHexRowBytes} class="w-48" />
        </div>
    </Section>
</Section>
