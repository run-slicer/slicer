<script lang="ts">
    import { encodings } from "$lib/workspace/encoding";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { workspaceEncoding, workspaceArchiveEncoding, workspaceArchiveDuplicateHandling } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
    import { t } from "$lib/i18n";
    import type { PaneProps } from "$lib/components/pane";

    let _: PaneProps = $props();
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
                {$t(`pane.prefs.workspace.duplicate-handling.${$workspaceArchiveDuplicateHandling}`)}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="skip">{$t("pane.prefs.workspace.duplicate-handling.skip")}</SelectItem>
                <SelectItem value="overwrite">{$t("pane.prefs.workspace.duplicate-handling.overwrite")}</SelectItem>
                <SelectItem value="rename">{$t("pane.prefs.workspace.duplicate-handling.rename")}</SelectItem>
            </SelectContent>
        </Select>
    </div>
</Section>
