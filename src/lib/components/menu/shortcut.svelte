<script lang="ts">
    import { MenubarShortcut } from "$lib/components/ui/menubar";
    import { format } from "$lib/shortcut";

    export let key: string;
    export let modifier: number;
</script>

<MenubarShortcut>{format(key, modifier)}</MenubarShortcut>
