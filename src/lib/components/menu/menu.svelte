<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import type { EditorConfig } from "$lib/components/pane";
    import { load } from "$lib/action/load";
    import { add } from "$lib/action/add";
    import { current as currentDecompiler, all as decompilers, swap as swapDecompiler } from "$lib/decompiler";
    import { Modifier } from "$lib/shortcut";
    import Shortcut from "./shortcut.svelte";
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

    export let config: EditorConfig;

    let viewType = config.view;
    $: config = { ...config, view: viewType };

    $: decompiler = $currentDecompiler.id;
</script>

<Menubar class="rounded-none border-b border-none px-2 lg:px-4">
    <MenubarMenu>
        <MenubarTrigger class="font-bold">slicer</MenubarTrigger>
        <MenubarContent>
            <MenubarItem disabled>About</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Theme</MenubarSubTrigger>
                <MenubarSubContent class="w-[230px]">
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
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">View</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Mode</MenubarSubTrigger>
                <MenubarSubContent class="w-[230px]">
                    <MenubarRadioGroup bind:value={viewType}>
                        <MenubarRadioItem value="text">Textual</MenubarRadioItem>
                        <MenubarRadioItem value="hex">Hexadecimal</MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Decompiler</MenubarSubTrigger>
                <MenubarSubContent class="w-[230px]">
                    <MenubarRadioGroup bind:value={decompiler} onValueChange={(id) => swapDecompiler(id || "")}>
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
