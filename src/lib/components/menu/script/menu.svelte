<script lang="ts">
    import { t } from "$lib/i18n";
    import {
        MenubarCheckboxItem,
        MenubarItem,
        MenubarSeparator,
        MenubarSub,
        MenubarSubContent,
        MenubarSubTrigger,
    } from "$lib/components/ui/menubar";
    import { type ProtoScript, ScriptState } from "$lib/script";
    import ScriptOption from "./option.svelte";
    import { Info, Trash2 } from "@lucide/svelte";
    import type { EventHandler } from "$lib/event";
    import { modals } from "svelte-modals";
    import { ScriptDialog, ScriptDeleteDialog } from "$lib/components/dialog";

    interface Props {
        proto: ProtoScript;
        handler: EventHandler;
    }

    let { proto, handler }: Props = $props();
    const script = $derived(proto.script);

    const handleEnabled = async (enabled: boolean) => {
        if (enabled) {
            await handler.loadScript(proto);
        } else {
            await handler.unloadScript(proto);
        }
    };
</script>

<MenubarSub>
    <MenubarSubTrigger>{script?.name || proto.id}</MenubarSubTrigger>
    <MenubarSubContent class="min-w-48">
        <MenubarCheckboxItem
            checked={proto.state === ScriptState.LOADED}
            disabled={proto.state === ScriptState.FAILED}
            onCheckedChange={handleEnabled}
        >
            {$t("menu.scripts.script.enabled")}
        </MenubarCheckboxItem>
        <MenubarSeparator />
        <MenubarItem inset class="justify-between" onclick={() => modals.open(ScriptDialog, { proto, handler })}>
            {$t("menu.scripts.script.info")}
            <Info size={16} />
        </MenubarItem>
        <MenubarItem
            inset
            class="data-highlighted:bg-destructive data-highlighted:text-primary-foreground justify-between"
            onclick={() => modals.open(ScriptDeleteDialog, { proto, handler })}
        >
            {$t("menu.scripts.script.delete")}
            <Trash2 size={16} />
        </MenubarItem>
        {#if proto.state === ScriptState.LOADED && script?.options}
            <MenubarSeparator />
            {#each script.options as option (option.id)}
                <ScriptOption inset {proto} {option} />
            {/each}
        {/if}
    </MenubarSubContent>
</MenubarSub>
