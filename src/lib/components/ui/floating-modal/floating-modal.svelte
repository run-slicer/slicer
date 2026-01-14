<script lang="ts">
  import { X, Pin, PinOff } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    onclose?: () => void;
    title: string;
    subtitle?: string;
    initialPosition?: { x: number; y: number };
    children: Snippet;
    modalElement?: HTMLDivElement
  }

  let { 
    open = $bindable(false), 
    onclose, 
    title, 
    subtitle, 
    initialPosition = { x: 200, y: 150 },
    children,
    modalElement = $bindable()
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

  function handleClose() {
    open = false;
    onclose?.();
  }

  function handleMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    isDragging = true;
    const rect = modalElement?.getBoundingClientRect();
    if (rect) {
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    position = {
      x: Math.max(0, Math.min(newX, window.innerWidth - 400)),
      y: Math.max(0, Math.min(newY, window.innerHeight - 100))
    };
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleClickOutside(e: MouseEvent) {
    if (pinned) return;
    if (modalElement && !modalElement.contains(e.target as Node)) {
      handleClose();
    }
  }

  $effect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  $effect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timeout);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  });
</script>

{#if open}
  <div
    bind:this={modalElement}
    class="fixed z-50 min-w-130 max-w-150 bg-popover border border-border rounded-lg shadow-xl"
    style="left: {position.x}px; top: {position.y}px;"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
    onkeydown={(e) => { if (e.key === 'Escape') handleClose(); }}
    tabindex="0"
  >
    <header
      class="flex items-start justify-between px-3 py-2 border-b border-border cursor-move select-none bg-muted/50 rounded-t-lg"
      onmousedown={handleMouseDown}
      role="presentation"
    >
      <div class="flex-1 min-w-0 pr-2">
        <p id="modal-title" class="font-semibold text-sm text-foreground leading-tight">
          {title}
        </p>
        {#if subtitle}
          <p id="modal-description" class="text-xs text-muted-foreground mt-0.5 leading-tight">
            {subtitle}
          </p>
        {/if}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button
          onclick={() => pinned = !pinned}
          class="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title={pinned ? 'Unpin' : 'Pin'}
        >
          {#if pinned}
            <Pin class="w-4 h-4" />
          {:else}
            <PinOff class="w-4 h-4" />
          {/if}
        </button>
        <button
          onclick={handleClose}
          class="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Close"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </header>

    <div class="max-h-100 overflow-auto">
      {@render children()}
    </div>
  </div>
{/if}
