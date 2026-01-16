<script lang="ts">
    import { X, Pin, PinOff } from "@lucide/svelte";
    import type { Snippet } from "svelte";
    import { t } from "$lib/i18n";

    interface Props {
        open: boolean;
        onclose?: () => void;
        title: string;
        subtitle?: string;
        initialPosition?: { x: number; y: number };
        children: Snippet;
        modalElement?: HTMLDivElement;
    }

    let {
        open = $bindable(false),
        onclose,
        title,
        subtitle,
        initialPosition = { x: 200, y: 150 },
        children,
        modalElement = $bindable(),
    }: Props = $props();

    let position = $state({ ...initialPosition });
    let pinned = $state(false);
    let isDragging = $state(false);
    let dragOffset = $state({ x: 0, y: 0 });

    $effect(() => {
        if (open) {
            position = { ...initialPosition };
            pinned = false;
        }
    });

    const handleClose = () => {
        open = false;
        onclose?.();
    };

    const handleMouseDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        isDragging = true;
        const rect = modalElement?.getBoundingClientRect();
        if (rect) {
            dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        position = {
            x: Math.max(0, Math.min(newX, window.innerWidth - 400)),
            y: Math.max(0, Math.min(newY, window.innerHeight - 100)),
        };
    };

    const handleMouseUp = () => {
        isDragging = false;
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (pinned) return;
        if (modalElement && !modalElement.contains(e.target as Node)) {
            handleClose();
        }
    };

    $effect(() => {
        if (isDragging) {
            document.body.style.userSelect = "none";
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.body.style.userSelect = "";
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    });

    $effect(() => {
        if (open) {
            const timeout = setTimeout(() => {
                document.addEventListener("mousedown", handleClickOutside);
            }, 100);
            return () => {
                clearTimeout(timeout);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    });
</script>

{#if open}
    <div
        bind:this={modalElement}
        class="bg-popover border-border fixed z-50 max-w-150 min-w-130 rounded-md border shadow-xl"
        style="left: {position.x}px; top: {position.y}px;"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onkeydown={(e) => {
            if (e.key === "Escape") handleClose();
        }}
        tabindex="0"
    >
        <header
            class="border-border bg-muted/50 flex cursor-move items-start justify-between rounded-t-lg border-b px-3 py-2 select-none"
            onmousedown={handleMouseDown}
            role="presentation"
        >
            <div class="min-w-0 flex-1 pr-2">
                <p id="modal-title" class="text-foreground text-sm leading-tight font-semibold">
                    {title}
                </p>
                {#if subtitle}
                    <p id="modal-description" class="text-muted-foreground mt-0.5 text-xs leading-tight">
                        {subtitle}
                    </p>
                {/if}
            </div>
            <div class="flex shrink-0 items-center gap-1">
                <button
                    onclick={() => (pinned = !pinned)}
                    class="hover:bg-accent text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                    title={$t(pinned ? "modal.unpin" : "modal.pin")}
                >
                    {#if pinned}
                        <Pin class="h-4 w-4" />
                    {:else}
                        <PinOff class="h-4 w-4" />
                    {/if}
                </button>
                <button
                    onclick={handleClose}
                    class="hover:bg-accent text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                    title={$t("modal.close")}
                >
                    <X class="h-4 w-4" />
                </button>
            </div>
        </header>

        <div class="max-h-100 overflow-auto">
            {@render children()}
        </div>
    </div>
{/if}
