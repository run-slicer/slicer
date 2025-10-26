<script lang="ts">
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { Label } from "$lib/components/ui/label";
    import { CircleQuestionMark } from "@lucide/svelte";
    import type { Snippet } from "svelte";

    interface Props {
        for: string;
        text: string;
        children?: Snippet;
    }

    let { for: forId, text, children }: Props = $props();
</script>

{#if children}
    <TooltipProvider>
        <div class="flex items-center gap-2">
            <Label for={forId}>{text}</Label>
            <Tooltip>
                <TooltipTrigger class="cursor-pointer">
                    <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">
                    {@render children()}
                </TooltipContent>
            </Tooltip>
        </div>
    </TooltipProvider>
{:else}
    <Label for={forId}>{text}</Label>
{/if}
