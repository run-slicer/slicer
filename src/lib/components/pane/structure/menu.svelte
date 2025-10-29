<script lang="ts">
    import { Code, GitBranchPlus } from "@lucide/svelte";
    import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "$lib/components/ui/context-menu";
    import ContextMenuLabel from "$lib/components/menu_label.svelte";
    import type { EventHandler } from "$lib/event";
    import { TabType } from "$lib/tab";
    import type { Entry } from "$lib/workspace";
    import { t } from "$lib/i18n";

    interface Props {
        title: string;
        entry: Entry;
        handler: EventHandler;
    }

    let { handler, entry, title }: Props = $props();
</script>

<ContextMenuContent class="max-w-[16rem] min-w-48">
    <ContextMenuLabel>{title}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem class="justify-between" onclick={() => handler.open(entry, TabType.CODE)}>
        {$t("pane.structure.menu.disasm")}
        <Code size={16} />
    </ContextMenuItem>
    <ContextMenuItem class="justify-between" onclick={() => handler.open(entry, TabType.GRAPH)}>
        {$t("pane.structure.menu.graph")}
        <GitBranchPlus size={16} />
    </ContextMenuItem>
</ContextMenuContent>
