<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import type { TabPosition } from "$lib/tab";
    import { paneIcon } from "$lib/components/icons";

    interface Props {
        title?: string;
        open: boolean;
        position: TabPosition;
        onchange?: (value: boolean) => void;
    }

    let { title, open = $bindable(), position, onchange }: Props = $props();

    let Icon = $derived(paneIcon(position, !open /* invert to display close icon when open */));
</script>

<Button
    variant="ghost"
    size="icon"
    {title}
    class="h-8 w-8"
    onclick={() => {
        open = !open;
        onchange?.(open);
    }}
>
    <Icon size={16} />
</Button>
