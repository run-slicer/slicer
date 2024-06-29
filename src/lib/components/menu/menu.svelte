<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import type { EditorConfig } from "$lib/components/pane";
    import { load } from "$lib/action/load";
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

    export let config: EditorConfig;

    let viewType = config.view;
    $: config = { ...config, view: viewType };

    $: decompiler = $currentDecompiler.id;

    const listenShortcut = (shortcut: string, callback: (e: KeyboardEvent) => void) => {
        const checks: ((e: KeyboardEvent) => boolean)[] = [];
        for (const key of shortcut.toLowerCase().split("+")) {
            switch (key) {
                case "ctrl":
                    checks.push((e) => e.ctrlKey);
                    break;
                case "alt":
                    checks.push((e) => e.altKey);
                    break;
                case "shift":
                    checks.push((e) => e.shiftKey);
                    break;
                default:
                    checks.push((e) => e.key.toLowerCase() === key);
            }
        }

        window.addEventListener("keydown", async (e) => {
            if (checks.every((check) => check(e))) {
                e.preventDefault();
                callback(e);
            }
        });
    };

    listenShortcut("Ctrl+O", load);
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
            <MenubarItem on:click={load}>
                Open <MenubarShortcut>Ctrl+O</MenubarShortcut>
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
