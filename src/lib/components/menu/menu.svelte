<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import { add, load, close } from "$lib/action";
    import { current as currentDecompiler, all as decompilers } from "$lib/decompiler";
    import { current as config } from "$lib/config";
    import { current as entry, entries } from "$lib/workspace";
    import { Modifier } from "$lib/shortcut";
    import Shortcut from "./shortcut.svelte";
    import ClearDialog from "./dialog/clear.svelte";
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
    } from "$lib/components/ui/menubar";

    $: decompiler = $currentDecompiler.id;

    let clearConfirmOpen = false;
</script>

<Menubar class="rounded-none border-b border-none px-2 lg:px-4">
    <MenubarMenu>
        <MenubarTrigger class="font-bold">slicer</MenubarTrigger>
        <MenubarContent>
            <MenubarItem disabled>About</MenubarItem>
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
            <MenubarSeparator />
            <MenubarItem disabled={$entry === null} on:click={close}>
                Close <Shortcut key="e" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem disabled={$entries.size === 0} on:click={() => (clearConfirmOpen = true)}>
                Clear workspace
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">View</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Mode</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$config.view}>
                        <MenubarRadioItem value="text">Textual</MenubarRadioItem>
                        <MenubarRadioItem value="hex">Hexadecimal</MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Decompiler</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup
                        bind:value={decompiler}
                        onValueChange={(id) => ($config.tools.decompiler.id = id || "")}
                    >
                        {#each decompilers.values() as { id, name }}
                            <MenubarRadioItem value={id}>{name || id}</MenubarRadioItem>
                        {/each}
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
        </MenubarContent>
    </MenubarMenu>
</Menubar>
<Separator />

<ClearDialog bind:open={clearConfirmOpen} />
