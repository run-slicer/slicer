<script lang="ts">
    import { Slider } from "$lib/components/ui/slider";
    import { Switch } from "$lib/components/ui/switch";
    import { editorWrap, editorTextSize, editorTextSizeSync } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
</script>

<Section id="editor" label="Editor">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="editorWrap" text="Word wrap">Wraps long lines in the editor.</Label>
        <Switch id="editorWrap" bind:checked={$editorWrap} />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="editorTextSize" text="Text size">Adjusts the default editor font size.</Label>
        <Slider
            type="single"
            id="editorTextSize"
            min={0.5}
            max={1.5}
            step={0.05}
            bind:value={$editorTextSize}
            class="w-48"
        />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <Label for="editorTextSizeSync" text="Sync text size">Synchronizes text size across all editors.</Label>
        <Switch id="editorTextSizeSync" bind:checked={$editorTextSizeSync} />
    </div>
</Section>
