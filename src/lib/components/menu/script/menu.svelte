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
    import { createEventDispatcher } from "svelte";
    import { Info, Trash2 } from "lucide-svelte";
    import { ActionType } from "$lib/action";

    export let proto: ProtoScript;
    const script = proto.script;

    const dispatch = createEventDispatcher();
</script>

<MenubarSub>
    <MenubarSubTrigger>{script?.name || proto.id}</MenubarSubTrigger>
    <MenubarSubContent class="w-[12rem]">
        <MenubarCheckboxItem
            checked={proto.state === ScriptState.LOADED}
            disabled={proto.state === ScriptState.FAILED}
            onCheckedChange={(checked) =>
                dispatch("action", { type: checked ? ActionType.SCRIPT_LOAD : ActionType.SCRIPT_UNLOAD, proto })}
        >
            Enabled
        </MenubarCheckboxItem>
        <MenubarSeparator />
        <MenubarItem inset class="justify-between" on:click={() => dispatch("open", { proto })}>
            Info <Info size={16} />
        </MenubarItem>
        <MenubarItem
            inset
            class="justify-between data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
            on:click={() => dispatch("delete", { proto })}
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
