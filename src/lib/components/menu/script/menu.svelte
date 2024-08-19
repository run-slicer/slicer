<script lang="ts">
    import {
        MenubarCheckboxItem,
        MenubarSeparator,
        MenubarSub,
        MenubarSubContent,
        MenubarSubTrigger,
    } from "$lib/components/ui/menubar";
    import { load, unload, ScriptState, type ProtoScript } from "$lib/script";
    import ScriptOption from "./option.svelte";
    import { MenubarItem } from "$lib/components/ui/menubar/index.js";
    import { createEventDispatcher } from "svelte";
    import { Info, Trash2 } from "lucide-svelte";

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
            onCheckedChange={(checked) => (checked ? load : unload)(proto)}
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
        {#if script?.options}
            <MenubarSeparator />
            {#each script.options as option (option.id)}
                <ScriptOption inset {proto} {option} />
            {/each}
        {/if}
    </MenubarSubContent>
</MenubarSub>
