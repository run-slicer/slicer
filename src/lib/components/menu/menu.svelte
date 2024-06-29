<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import { loadClass, loadJar } from "$lib/action/load";
    import { current as currentDecompiler, all as decompilers, swap as swapDecompiler } from "$lib/decompiler";
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
        MenubarShortcut,
        MenubarRadioGroup,
        MenubarRadioItem,
    } from "$lib/components/ui/menubar";

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
                Preferences <MenubarShortcut>Ctrl+Alt+S</MenubarShortcut>
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">File</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Open</MenubarSubTrigger>
                <MenubarSubContent class="w-[230px]">
                    <MenubarItem on:click={loadClass}>Class</MenubarItem>
                    <MenubarItem on:click={loadJar}>JAR</MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">View</MenubarTrigger>
        <MenubarContent>
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
