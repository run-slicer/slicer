<script lang="ts">
    import { Switch } from "$lib/components/ui/switch";
    import { analysisBackground, analysisJdkClasses } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
</script>

<Section id="analysis" labelKey="pane.prefs.section.analysis">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label
            for="analysisBackground"
            textKey="pane.prefs.analysis.background"
            descKey="pane.prefs.analysis.background.desc"
        />
        <Switch id="analysisBackground" bind:checked={$analysisBackground} />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label
            for="analysisJdkClasses"
            textKey="pane.prefs.analysis.jdk-classes"
            descKey="pane.prefs.analysis.jdk-classes.desc"
        />
        <Switch id="analysisJdkClasses" bind:checked={$analysisJdkClasses} />
    </div>
</Section>
