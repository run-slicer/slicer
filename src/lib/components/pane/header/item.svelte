<script lang="ts" module>
    export type CloseType = "self" | "others" | "right" | "all";
</script>

<script lang="ts">
    import { Pin, X } from "@lucide/svelte";
    import type { StyledIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import {
        ContextMenu,
        ContextMenuTrigger,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
    } from "$lib/components/ui/context-menu";
    import { Modifier } from "$lib/shortcut";
    import Shortcut from "$lib/components/menu/shortcut.svelte";
    import ContextMenuLabel from "$lib/components/menu_label.svelte";
    import { t } from "$lib/i18n";

    interface Props {
        name?: string;
        icon?: StyledIcon | null;
        active?: boolean;
        closeable?: boolean;
        pinned?: boolean;
        separate?: boolean;
        onclick?: () => void;
        onclose?: (type: CloseType) => void;
        onpin?: (value: boolean) => void;
    }

    let {
        name = "",
        icon = null,
        active = true,
        closeable = false,
        pinned = false,
        separate = false,
        onclick,
        onclose,
        onpin,
    }: Props = $props();

    let Icon = $derived(icon?.icon);

    const handleClose = (e: MouseEvent | KeyboardEvent, type: CloseType) => {
        e.stopPropagation();
        onclose?.(type);
    };

    const handlePin = (e: MouseEvent | KeyboardEvent) => {
        e.stopPropagation();

        const newValue = !pinned;
        pinned = newValue;
        onpin?.(newValue);
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
                "bg-pane-header inline-flex h-full max-w-96 cursor-pointer items-center px-3",
                !active || "border-t-primary bg-background border-t",
                separate && "border-r-primary border-r"
            )}
            aria-label={name}
            {onclick}
        >
            {#if icon}
                <Icon size={16} class={cn("mr-1.5 min-w-4", icon.classes)} />
            {/if}
            <span class="overflow-hidden text-sm break-keep text-ellipsis whitespace-nowrap">{name}</span>
            {#if pinned}
                <div
                    role="button"
                    tabindex="-1"
                    class="ml-3 cursor-pointer"
                    aria-label="Close"
                    onclick={handlePin}
                    onkeydown={handlePin}
                >
                    <Pin size={14} class="text-muted-foreground/60 hover:text-muted-foreground/80 min-w-3.5" />
                </div>
            {:else if closeable}
                <div
                    role="button"
                    tabindex="-1"
                    class="ml-3 cursor-pointer"
                    aria-label="Close"
                    onclick={(e) => handleClose(e, "self")}
                    onkeydown={(e) => handleClose(e, "self")}
                >
                    <X size={14} class="text-muted-foreground/60 hover:text-muted-foreground/80 min-w-3.5" />
                </div>
            {/if}
        </button>
    </ContextMenuTrigger>
    <ContextMenuContent class="min-w-48">
        <ContextMenuLabel>{name}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onclick={(e) => handleClose(e, "self")} class="justify-between">
            {$t("pane.header.menu.close.self")}
            {#if active}<Shortcut key="w" modifier={Modifier.CTRL | Modifier.ALT} />{/if}
        </ContextMenuItem>
        <ContextMenuItem onclick={(e) => handleClose(e, "others")}>
            {$t("pane.header.menu.close.others")}
        </ContextMenuItem>
        <ContextMenuItem onclick={(e) => handleClose(e, "right")}>
            {$t("pane.header.menu.close.right")}
        </ContextMenuItem>
        <ContextMenuItem onclick={(e) => handleClose(e, "all")}>
            {$t("pane.header.menu.close.all")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onclick={handlePin}>
            {#if pinned}
                {$t("pane.header.menu.unpin")}
            {:else}
                {$t("pane.header.menu.pin")}
            {/if}
        </ContextMenuItem>
    </ContextMenuContent>
</ContextMenu>
