<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import { add, load, close, export_ } from "$lib/action";
    import { current as currentDisasm, all as disasms } from "$lib/disasm";
    import { editorView, toolsDisasm } from "$lib/state";
    import { current as entry, entries } from "$lib/workspace";
    import { Modifier } from "$lib/shortcut";
    import { groupBy } from "$lib/arrays";
    import Shortcut from "./shortcut.svelte";
    import AboutDialog from "./dialog/about.svelte";
    import ClearConfirmDialog from "./dialog/clear.svelte";
    import {
        Menubar,
        MenubarMenu,
        MenubarTrigger,
        MenubarContent,
        MenubarSeparator,
        MenubarSub,
        MenubarSubTrigger,
        MenubarSubContent,
        MenubarItem,
        MenubarRadioGroup,
        MenubarRadioItem,
        MenubarLabel,
    } from "$lib/components/ui/menubar";

    $: disasm = $currentDisasm.id;

    let aboutOpen = false;
    let clearConfirmOpen = false;
</script>

<Menubar class="rounded-none border-b border-none px-2 lg:px-4">
    <MenubarMenu>
        <MenubarTrigger class="font-bold">slicer</MenubarTrigger>
        <MenubarContent>
            <MenubarItem on:click={() => (aboutOpen = true)}>About</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Theme</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$userPrefersMode}>
                        <MenubarRadioItem value="system">System</MenubarRadioItem>
                        <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                        <MenubarRadioItem value="light">Light</MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarItem disabled>
                Preferences <Shortcut key="s" modifier={Modifier.Ctrl | Modifier.Alt} />
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">File</MenubarTrigger>
        <MenubarContent>
            <MenubarItem on:click={load}>
                Open <Shortcut key="o" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem on:click={add}>
                Add <Shortcut key="o" modifier={Modifier.Ctrl | Modifier.Shift} />
            </MenubarItem>
            <MenubarItem disabled={$entries.size === 0} on:click={() => (clearConfirmOpen = true)}>
                Clear all
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled={$entry === null} on:click={() => export_()}>
                Export <Shortcut key="e" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem disabled={$entry === null} on:click={close}>
                Close <Shortcut key="w" modifier={Modifier.Ctrl | Modifier.Alt} />
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">View</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Mode</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$editorView}>
                        <MenubarRadioItem value="auto">Automatic</MenubarRadioItem>
                        <MenubarRadioItem value="text">Textual</MenubarRadioItem>
                        <MenubarRadioItem value="hex">Hexadecimal</MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Disassembler</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={disasm} onValueChange={(id) => ($toolsDisasm = id || "")}>
                        {#each groupBy(Array.from(disasms.values()), (d) => d.group).entries() as [group, members]}
                            <MenubarLabel>{group || "Other"}</MenubarLabel>
                            {#each members as { id, name }}
                                <MenubarRadioItem value={id}>{name || id}</MenubarRadioItem>
                            {/each}
                        {/each}
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
        </MenubarContent>
    </MenubarMenu>
</Menubar>
<Separator />

<AboutDialog bind:open={aboutOpen} />
<ClearConfirmDialog bind:open={clearConfirmOpen} />
