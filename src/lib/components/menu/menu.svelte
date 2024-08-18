<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import { add, load, close, export_ } from "$lib/action";
    import { current as currentDisasm, all as disasms } from "$lib/disasm";
    import { projectOpen, loggingOpen, toolsDisasm } from "$lib/state";
    import { entries } from "$lib/workspace";
    import { type ProtoScript, scripts } from "$lib/script";
    import { current as currentTab, TabType } from "$lib/tab";
    import { Modifier } from "$lib/shortcut";
    import { groupBy } from "$lib/arrays";
    import Shortcut from "./shortcut.svelte";
    import ScriptMenu from "./script/menu.svelte";
    import AboutDialog from "./dialog/about.svelte";
    import ScriptDialog from "./dialog/script.svelte";
    import ScriptDeleteConfirmDialog from "./dialog/script_delete.svelte";
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
    import { Terminal, Folders, GitBranchPlus, Clipboard, Binary, Code } from "lucide-svelte";
    import { openEntry, loadClipboardScript } from "./";

    $: disasm = $currentDisasm.id;

    $: tabType = $currentTab?.type;
    $: entry = $currentTab?.entry || null;

    let aboutOpen = false;
    let clearConfirmOpen = false;

    let scriptDeleteOpen: ProtoScript | null = null;
    let scriptInfoOpen: ProtoScript | null = null;
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
                <MenubarSubTrigger>Disassembler</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={disasm} onValueChange={(id) => ($toolsDisasm = id || "")}>
                        {#each groupBy(Array.from(disasms.values()), (d) => d.group) as [group, members]}
                            {#if group}
                                <MenubarLabel inset>{group}</MenubarLabel>
                            {/if}
                            {#each members as { id, name }}
                                <MenubarRadioItem value={id}>{name || id}</MenubarRadioItem>
                            {/each}
                        {/each}
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem
                class="justify-between"
                disabled={entry === null || tabType === TabType.CODE}
                on:click={() => openEntry(TabType.CODE)}
            >
                Code <Code size={16} />
            </MenubarItem>
            <MenubarItem
                class="justify-between"
                disabled={entry === null || tabType === TabType.HEX}
                on:click={() => openEntry(TabType.HEX)}
            >
                Hexadecimal <Binary size={16} />
            </MenubarItem>
            <MenubarItem
                class="justify-between"
                disabled={entry === null || tabType === TabType.FLOW_GRAPH}
                on:click={() => openEntry(TabType.FLOW_GRAPH)}
            >
                Flow graph <GitBranchPlus size={16} />
            </MenubarItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">Scripts</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Import</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarItem class="justify-between" on:click={loadClipboardScript}>
                        From clipboard <Clipboard size={16} />
                    </MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
            {#if $scripts.length > 0}
                <MenubarSeparator />
                {#each $scripts as proto (proto.id)}
                    <ScriptMenu
                        {proto}
                        on:open={(e) => (scriptInfoOpen = e.detail.proto)}
                        on:delete={(e) => (scriptDeleteOpen = e.detail.proto)}
                    />
                {/each}
            {/if}
        </MenubarContent>
    </MenubarMenu>
</Menubar>
<Separator />

<AboutDialog bind:open={aboutOpen} />
<ScriptDialog bind:proto={scriptInfoOpen} />
<ScriptDeleteConfirmDialog bind:proto={scriptDeleteOpen} />
<ClearConfirmDialog bind:open={clearConfirmOpen} />
