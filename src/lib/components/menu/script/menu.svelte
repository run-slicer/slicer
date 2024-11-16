<script lang="ts">
    import {
        MenubarCheckboxItem,
        MenubarSeparator,
        MenubarSub,
        MenubarSubContent,
        MenubarSubTrigger,
    } from "$lib/components/ui/menubar";
    import { ScriptState, type ProtoScript } from "$lib/script";
    import ScriptOption from "./option.svelte";
    import { MenubarItem } from "$lib/components/ui/menubar";
    import { Info, Trash2 } from "lucide-svelte";
    import { type ActionHandler, ActionType, type ScriptAction } from "$lib/action";

    interface Props {
        proto: ProtoScript;
        onopen?: (proto: ProtoScript) => void;
        ondelete?: (proto: ProtoScript) => void;
        onaction?: ActionHandler;
    }

    let { proto, onopen, ondelete, onaction }: Props = $props();
    const script = $derived(proto.script);

    const handleEnabled = (enabled: boolean) => {
        onaction?.({ type: enabled ? ActionType.SCRIPT_LOAD : ActionType.SCRIPT_UNLOAD, proto } as ScriptAction);
    };
</script>

<MenubarSub>
    <MenubarSubTrigger>{script?.name || proto.id}</MenubarSubTrigger>
    <MenubarSubContent class="w-[12rem]">
        <MenubarCheckboxItem
            checked={proto.state === ScriptState.LOADED}
            disabled={proto.state === ScriptState.FAILED}
            onCheckedChange={handleEnabled}
        >
            Enabled
        </MenubarCheckboxItem>
        <MenubarSeparator />
        <MenubarItem inset class="justify-between" onclick={() => onopen?.(proto)}>
            Info <Info size={16} />
        </MenubarItem>
        <MenubarItem
            inset
            class="justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
            onclick={() => ondelete?.(proto)}
        >
            Delete <Trash2 size={16} />
        </MenubarItem>
        {#if proto.state === ScriptState.LOADED && script?.options}
            <MenubarSeparator />
            {#each script.options as option (option.id)}
                <ScriptOption inset {proto} {option} />
            {/each}
        {/if}
    </MenubarSubContent>
</MenubarSub>
