<script lang="ts">
    import { MenubarSeparator, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "$lib/components/ui/menubar";
    import { load, unload, ScriptState, type ProtoScript } from "$lib/script";
    import ScriptOption from "./option.svelte";
    import { MenubarCheckboxItem } from "$lib/components/ui/menubar/index.js";

    export let proto: ProtoScript;
    const script = proto.script;
</script>

<MenubarSub>
    <MenubarSubTrigger>{script ? script.name || script.id : proto.id}</MenubarSubTrigger>
    <MenubarSubContent class="w-[12rem]">
        <MenubarCheckboxItem
            checked={proto.state === ScriptState.LOADED}
            disabled={proto.state === ScriptState.FAILED}
            onCheckedChange={(checked) => (checked ? load : unload)(proto)}
        >
            Enabled
        </MenubarCheckboxItem>
        <MenubarSeparator />
        {#if script?.options}
            {#each script.options as option (option.id)}
                <ScriptOption {proto} {option} />
            {/each}
        {/if}
    </MenubarSubContent>
</MenubarSub>
