<script lang="ts">
    import { X, Pin, PinOff } from "@lucide/svelte";
    import { type Snippet, untrack } from "svelte";
    import { t } from "$lib/i18n";

    interface Props {
        open: boolean;
        title: string;
        subtitle?: string;
        initialPosition?: { x: number; y: number };
        children: Snippet;
        modalElement?: HTMLDivElement;
    }

    let {
        open = $bindable(false),
        title,
        subtitle,
        initialPosition = { x: 200, y: 150 },
        children,
        modalElement = $bindable(),
    }: Props = $props();

    let position = $state({ ...initialPosition });
    let size = $state({ width: 520, height: 300 });
    let pinned = $state(false);
    let isDragging = $state(false);
    let isResizing = $state(false);
    let dragOffset = $state({ x: 0, y: 0 });

    $effect(() => {
        if (open) {
            position = { ...untrack(() => initialPosition) };
            pinned = false;
        }
    });

    const handleClose = () => {
        open = false;
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
        isResizing = false;
    };

    const handleResizeMouseDown = (e: MouseEvent) => {
        e.stopPropagation();
        isResizing = true;
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing) return;
        const newWidth = Math.max(300, e.clientX - position.x);
        const newHeight = Math.max(200, e.clientY - position.y);
        size = { width: newWidth, height: newHeight };
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (pinned) return;
        if (modalElement && !modalElement.contains(e.target as Node)) {
            handleClose();
        }
    };

    $effect(() => {
        if (isDragging || isResizing) {
            document.body.style.userSelect = "none";
            if (isDragging) {
                document.addEventListener("mousemove", handleMouseMove);
            }
            if (isResizing) {
                document.addEventListener("mousemove", handleResizeMove);
            }
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.body.style.userSelect = "";
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mousemove", handleResizeMove);
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
        class="bg-popover border-border fixed z-50 flex flex-col rounded-md border shadow-xl"
        style="left: {position.x}px; top: {position.y}px; width: {size.width}px; height: {size.height}px;"
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

        <div class="flex h-full w-full flex-col overflow-auto">
            {@render children()}
        </div>

        <div
            class="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize"
            onmousedown={handleResizeMouseDown}
            role="presentation"
            style="touch-action: none;"
        >
            <svg class="text-muted-foreground h-full w-full opacity-50 hover:opacity-100" viewBox="0 0 16 16">
                <path
                    d="M 14 2 L 2 14 M 14 6 L 6 14 M 14 10 L 10 14"
                    stroke="currentColor"
                    stroke-width="1"
                    fill="none"
                    stroke-linecap="round"
                />
            </svg>
        </div>
    </div>
{/if}
