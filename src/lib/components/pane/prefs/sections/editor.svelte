<script lang="ts">
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { CircleQuestionMark } from "@lucide/svelte";
    import { Label } from "$lib/components/ui/label";
    import { Slider } from "$lib/components/ui/slider";
    import { Switch } from "$lib/components/ui/switch";
    import { editorWrap, editorTextSize, editorTextSizeSync } from "$lib/state";
    import Section from "../section.svelte";
</script>

<Section id="editor" label="Editor">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="editorWrap">Word wrap</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Wraps long lines in the editor.</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
        <Switch id="editorWrap" bind:checked={$editorWrap} />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="editorTextSize">Text size</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Adjusts the default editor font size.</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
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
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="editorTextSizeSync">Sync text size</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Synchronizes text size across all editors.</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
        <Switch id="editorTextSizeSync" bind:checked={$editorTextSizeSync} />
    </div>
</Section>
