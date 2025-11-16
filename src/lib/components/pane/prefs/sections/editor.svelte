<script lang="ts">
    import { Slider } from "$lib/components/ui/slider";
    import { Switch } from "$lib/components/ui/switch";
    import { editorWrap, editorTextSize, editorTextSizeSync } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
    import type { PaneProps } from "$lib/components/pane";

    let _: PaneProps = $props();
</script>

<Section id="editor" labelKey="pane.prefs.section.editor">
    <div class="grid min-h-[2.5rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label for="editorWrap" textKey="pane.prefs.editor.word-wrap" descKey="pane.prefs.editor.word-wrap.desc" />
        <Switch id="editorWrap" bind:checked={$editorWrap} />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label for="editorTextSize" textKey="pane.prefs.editor.text-size" descKey="pane.prefs.editor.text-size.desc" />
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
    <div class="grid min-h-[2.5rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label
            for="editorTextSizeSync"
            textKey="pane.prefs.editor.sync-text-size"
            descKey="pane.prefs.editor.sync-text-size.desc"
        />
        <Switch id="editorTextSizeSync" bind:checked={$editorTextSizeSync} />
    </div>
</Section>
