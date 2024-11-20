<script lang="ts">
    import { MenubarShortcut } from "$lib/components/ui/menubar";
    import { format } from "$lib/shortcut";

    interface Props {
        key: string;
        modifier: number;
    }

    let { key, modifier }: Props = $props();
</script>

<MenubarShortcut>{format(key, modifier)}</MenubarShortcut>
