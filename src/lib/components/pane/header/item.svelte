<script lang="ts">
    import { X } from "lucide-svelte";
    import type { StyledIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";

    interface Props {
        name?: string;
        icon?: StyledIcon | null;
        active?: boolean;
        closeable?: boolean;
        onclick?: () => void;
        onclose?: () => void;
    }

    let { name = "", icon = null, active = true, closeable = false, onclick, onclose }: Props = $props();

    let Icon = $derived(icon?.icon);

    const handleClose = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();
        onclose?.();
    };

    let elem: HTMLButtonElement | undefined = $state();
    $effect(() => {
        if (elem && active) {
            elem.scrollIntoView();
        }
    });
</script>

<button
    bind:this={elem}
    class={cn(
        "inline-flex h-full max-w-96 cursor-default items-center px-3",
        !active || "border-t-[1px] border-t-primary bg-background"
    )}
    aria-label={name}
    {onclick}
>
    {#if icon}
        <Icon size={16} class={cn("mr-1.5 min-w-[16px]", icon.classes)} />
    {/if}
    <span class="overflow-hidden text-ellipsis whitespace-nowrap break-keep text-sm">{name}</span>
    {#if closeable}
        <div
            role="button"
            tabindex="-1"
            class="ml-3 cursor-pointer"
            aria-label="Close"
            onclick={handleClose}
            onkeydown={handleClose}
        >
            <X size={14} class="min-w-[14px] text-muted-foreground/60 hover:text-muted-foreground/80" />
        </div>
    {/if}
</button>
