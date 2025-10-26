<script lang="ts">
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { CircleQuestionMark } from "@lucide/svelte";
    import { Label } from "$lib/components/ui/label";
    import { Switch } from "$lib/components/ui/switch";
    import { analysisBackground, analysisJdkClasses } from "$lib/state";
    import Section from "../section.svelte";
</script>

<Section id="analysis" label="Analysis">
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="analysisBackground">Background analysis</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        Whether analysis should run in the background or on-demand.
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
        <Switch id="analysisBackground" bind:checked={$analysisBackground} />
    </div>
    <div class="grid min-h-[2.5rem] grid-cols-[16rem_10rem_1fr] items-center gap-4">
        <TooltipProvider>
            <div class="flex items-center gap-2">
                <Label for="analysisJdkClasses">Fetch JDK classes</Label>
                <Tooltip>
                    <TooltipTrigger>
                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        Whether JDK classes should be made available to disassemblers (improves output quality).
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
        <Switch id="analysisJdkClasses" bind:checked={$analysisJdkClasses} />
    </div>
</Section>
