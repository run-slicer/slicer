<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import { add, load, close, export_ } from "$lib/action";
    import { current as currentDisasm, all as disasms } from "$lib/disasm";
    import { projectOpen, editorView, loggingOpen, toolsDisasm, View } from "$lib/state";
    import { entries } from "$lib/workspace";
    import { scripts } from "$lib/script";
    import { current as currentTab, TabType } from "$lib/tab";
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
        MenubarCheckboxItem,
    } from "$lib/components/ui/menubar";
    import { Terminal, Folders, GitBranchPlus } from "lucide-svelte";
    import { openEntry } from "./";

    $: disasm = $currentDisasm.id;
    $: entry = $currentTab?.entry || null;

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
            <!-- <MenubarItem disabled>
                Preferences <Shortcut key="s" modifier={Modifier.Ctrl | Modifier.Alt} />
            </MenubarItem> -->
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
            <MenubarItem disabled={entry === null} on:click={() => export_()}>
                Export <Shortcut key="e" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem disabled={entry === null} on:click={close}>
                Close <Shortcut key="w" modifier={Modifier.Ctrl | Modifier.Alt} />
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">View</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Pane</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarCheckboxItem bind:checked={$projectOpen}>
                        <Folders size={16} class="mr-1.5" /> Project
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem bind:checked={$loggingOpen}>
                        <Terminal size={16} class="mr-1.5" /> Logging
                    </MenubarCheckboxItem>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
                <MenubarSubTrigger>Mode</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$editorView}>
                        <MenubarRadioItem value={View.AUTO}>Automatic</MenubarRadioItem>
                        <MenubarRadioItem value={View.TEXT}>Textual</MenubarRadioItem>
                        <MenubarRadioItem value={View.HEX}>Hexadecimal</MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Disassembler</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={disasm} onValueChange={(id) => ($toolsDisasm = id || "")}>
                        {#each groupBy(Array.from(disasms.values()), (d) => d.group).entries() as [group, members]}
                            {#if group}
                                <MenubarLabel>{group}</MenubarLabel>
                            {/if}
                            {#each members as { id, name }}
                                <MenubarRadioItem value={id}>{name || id}</MenubarRadioItem>
                            {/each}
                        {/each}
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarItem
                class="justify-between"
                disabled={entry === null}
                on:click={() => openEntry(TabType.FLOW_GRAPH)}
            >
                Flow graph <GitBranchPlus size={16} />
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">Scripts</MenubarTrigger>
        <MenubarContent>
            {#each $scripts as protoScript (protoScript.url)}
                {@const script = protoScript.script}
                <MenubarSub>
                    <MenubarSubTrigger>{script ? (script.name || script.id) : "<unknown>"}</MenubarSubTrigger>
                    <MenubarSubContent class="w-[12rem]">
                        {#if script?.options}
                            <!-- TODO -->
                        {/if}
                    </MenubarSubContent>
                </MenubarSub>
            {/each}
        </MenubarContent>
    </MenubarMenu>
</Menubar>
<Separator />

<AboutDialog bind:open={aboutOpen} />
<ClearConfirmDialog bind:open={clearConfirmOpen} />
