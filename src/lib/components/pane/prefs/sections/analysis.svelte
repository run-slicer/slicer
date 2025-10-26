<script lang="ts">
    import { Switch } from "$lib/components/ui/switch";
    import { analysisBackground, analysisJdkClasses } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
</script>

<Section id="analysis" label="Analysis">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="analysisBackground" text="Background analysis">
            Whether analysis should run in the background or on-demand.
        </Label>
        <Switch id="analysisBackground" bind:checked={$analysisBackground} />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="analysisJdkClasses" text="Fetch JDK classes">
            Whether JDK classes should be made available to disassemblers (improves output quality).
        </Label>
        <Switch id="analysisJdkClasses" bind:checked={$analysisJdkClasses} />
    </div>
</Section>
