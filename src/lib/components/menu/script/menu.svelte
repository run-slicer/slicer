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
    <MenubarSubTrigger>{script ? script.name || script.id : proto.id}</MenubarSubTrigger>
    <MenubarSubContent class="w-[12rem]">
        <MenubarItem on:click={() => dispatch("open", { proto })}>
            <Info class="mr-2" size={16} /> Info
        </MenubarItem>
        <MenubarSeparator />
        <MenubarCheckboxItem
            checked={proto.state === ScriptState.LOADED}
            disabled={proto.state === ScriptState.FAILED}
            onCheckedChange={(checked) => (checked ? load : unload)(proto)}
        >
            Enabled
        </MenubarCheckboxItem>
        <MenubarItem
            class="data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
            on:click={() => dispatch("delete", { proto })}
        >
            <Trash2 class="mr-2" size={16} /> Delete
        </MenubarItem>
        {#if script?.options}
            <MenubarSeparator />
            {#each script.options as option (option.id)}
                <ScriptOption {proto} {option} />
            {/each}
        {/if}
    </MenubarSubContent>
</MenubarSub>
