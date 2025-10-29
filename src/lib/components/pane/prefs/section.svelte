<script lang="ts">
    import type { Snippet } from "svelte";
    import { cn } from "$lib/components/utils";
    import { t, type TranslationKey } from "$lib/i18n";

    interface Props {
        id: string;
        labelKey: TranslationKey;
        small?: boolean;
        children?: Snippet;
    }

    let { id, labelKey, small, children }: Props = $props();
</script>

<div class="space-y-3" data-section={id}>
    <h2 class={cn("border-b pb-2 font-semibold", small || "text-lg")}>
        {$t(labelKey)}
    </h2>
    <div class="grid gap-2">
        {@render children?.()}
    </div>
</div>
