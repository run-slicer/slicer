<script lang="ts" module>
    import { TabPosition } from "$lib/tab";
    import type { Icon } from "$lib/components/icons";
    import {
        PanelTopOpen,
        PanelTopClose,
        PanelBottomOpen,
        PanelBottomClose,
        PanelLeftOpen,
        PanelLeftClose,
        PanelRightOpen,
        PanelRightClose,
    } from "lucide-svelte";

    export const pickIcon = (pos: TabPosition, open: boolean): Icon => {
        switch (pos) {
            case TabPosition.PRIMARY_TOP:
                return open ? PanelTopOpen : PanelTopClose;
            case TabPosition.PRIMARY_BOTTOM:
                return open ? PanelBottomOpen : PanelBottomClose;
            case TabPosition.SECONDARY_LEFT:
                return open ? PanelLeftOpen : PanelLeftClose;
            case TabPosition.SECONDARY_RIGHT:
                return open ? PanelRightOpen : PanelRightClose;
        }

        throw new Error("Invalid tab position");
    };
</script>

<script lang="ts">
    import { Button } from "$lib/components/ui/button";

    interface Props {
        open: boolean;
        position: TabPosition;
    }

    let { open = $bindable(), position }: Props = $props();

    let Icon = $derived(pickIcon(position, !open /* invert to display close icon when open */));
</script>

<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => (open = !open)}>
    <Icon />
</Button>
