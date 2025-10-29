<script lang="ts">
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "$lib/components/ui/tooltip";
    import { Label } from "$lib/components/ui/label";
    import { CircleQuestionMark } from "@lucide/svelte";
    import { t, type TranslationKey } from "$lib/i18n";

    interface Props {
        for: string;
        textKey: TranslationKey;
        descKey?: TranslationKey;
    }

    let { for: forId, textKey, descKey }: Props = $props();
</script>

{#if descKey}
    <TooltipProvider>
        <div class="flex items-center gap-2">
            <Label for={forId}>{$t(textKey)}</Label>
            <Tooltip>
                <TooltipTrigger class="cursor-pointer">
                    <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">
                    {@html $t(descKey)}
                </TooltipContent>
            </Tooltip>
        </div>
    </TooltipProvider>
{:else}
    <Label for={forId}>{$t(textKey)}</Label>
{/if}
