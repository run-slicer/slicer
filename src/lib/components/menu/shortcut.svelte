<script lang="ts">
    import { MenubarShortcut } from "$lib/components/ui/menubar";
    import { format } from "$lib/shortcut";

    interface Props {
        key: string;
        modifier: number;
        short?: boolean;
    }

    let { key, modifier, short = false }: Props = $props();
</script>

<MenubarShortcut>{format(key, modifier, short)}</MenubarShortcut>
