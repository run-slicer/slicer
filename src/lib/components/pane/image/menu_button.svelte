<script lang="ts">
    import type { Icon } from "$lib/components/icons";

    interface Props {
        icon: Icon;
        label: string;
        onclick?: (e: MouseEvent) => void;
    }

    let { icon: IconComponent, label, onclick }: Props = $props();
</script>

<button title={label} aria-label={label} {onclick}>
    <IconComponent size={14} class="hover:text-muted-foreground min-w-[14px]" />
</button>
