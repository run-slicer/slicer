<script lang="ts" module>
    export type CloseType = "self" | "others" | "right" | "all";
</script>

<script lang="ts">
    import { X } from "@lucide/svelte";
    import type { StyledIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "$lib/components/ui/context-menu";
    import { Modifier } from "$lib/shortcut";
    import Shortcut from "$lib/components/menu/shortcut.svelte";

    interface Props {
        name?: string;
        icon?: StyledIcon | null;
        active?: boolean;
        closeable?: boolean;
        onclick?: () => void;
        onclose?: (type: CloseType) => void;
    }

    let { name = "", icon = null, active = true, closeable = false, onclick, onclose }: Props = $props();

    let Icon = $derived(icon?.icon);

    const handleClose = (e: MouseEvent | KeyboardEvent, type: CloseType) => {
        e.stopPropagation();
        onclose?.(type);
    };

    let elem: HTMLButtonElement | undefined = $state();
    $effect(() => {
        if (elem && active) {
            elem.scrollIntoView();
        }
    });
</script>

<ContextMenu>
    <ContextMenuTrigger>
        <button
            bind:this={elem}
            class={cn(
                "inline-flex h-full max-w-96 cursor-default items-center px-3",
                !active || "border-t-primary bg-background border-t"
            )}
            aria-label={name}
            {onclick}
        >
            {#if icon}
                <Icon size={16} class={cn("mr-1.5 min-w-[16px]", icon.classes)} />
            {/if}
            <span class="overflow-hidden text-sm break-keep text-ellipsis whitespace-nowrap">{name}</span>
            {#if closeable}
                <div
                    role="button"
                    tabindex="-1"
                    class="ml-3 cursor-pointer"
                    aria-label="Close"
                    onclick={(e) => handleClose(e, "self")}
                    onkeydown={(e) => handleClose(e, "self")}
                >
                    <X size={14} class="text-muted-foreground/60 hover:text-muted-foreground/80 min-w-[14px]" />
                </div>
            {/if}
        </button>
    </ContextMenuTrigger>
    <ContextMenuContent>
        <ContextMenuItem onclick={(e) => handleClose(e, "self")} class="justify-between">
            Close <Shortcut key="w" modifier={Modifier.CTRL | Modifier.ALT} />
        </ContextMenuItem>
        <ContextMenuItem onclick={(e) => handleClose(e, "others")}>
            Close Others
        </ContextMenuItem>
        <ContextMenuItem onclick={(e) => handleClose(e, "right")}>
            Close to the Right
        </ContextMenuItem>
        <ContextMenuItem onclick={(e) => handleClose(e, "all")}>
            Close All
        </ContextMenuItem>
    </ContextMenuContent>
</ContextMenu>
