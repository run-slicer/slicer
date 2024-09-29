<script lang="ts">
    import { mode, userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import {
        themeColor,
        themeRadius,
        viewMode,
        projectOpen,
        loggingOpen,
        editorWrap,
        workspaceEncoding,
        workspaceArchiveEncoding,
    } from "$lib/state";
    import { distractionFree } from "$lib/mode";
    import { type Entry, EntryType } from "$lib/workspace";
    import { encodings } from "$lib/workspace/encoding";
    import type { ProtoScript } from "$lib/script";
    import { type Tab, TabType } from "$lib/tab";
    import { ActionType } from "$lib/action";
    import { Modifier } from "$lib/shortcut";
    import Shortcut from "./shortcut.svelte";
    import ScriptMenu from "./script/menu.svelte";
    import {
        AboutDialog,
        ScriptDialog,
        ScriptLoadDialog,
        ScriptDeleteDialog,
        ClearDialog,
        PrefsClearDialog,
    } from "$lib/components/dialog";
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
        MenubarCheckboxItem,
    } from "$lib/components/ui/menubar";
    import {
        Terminal,
        Folders,
        GitBranchPlus,
        Clipboard,
        Binary,
        Code,
        Globe,
        WrapText,
        Upload,
        Download,
        Square,
        SquareX,
        SquareCode,
        Scan,
        Circle,
        Settings,
        Moon,
        Sun,
        MonitorX,
    } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { toast } from "svelte-sonner";
    import { themes } from "$lib/theme";

    export let tab: Tab | null;
    export let entries: Entry[];
    export let scripts: ProtoScript[];

    let aboutOpen = false;
    let clearOpen = false;
    let prefsClearOpen = false;

    let scriptLoadOpen = false;
    let scriptDeleteOpen: ProtoScript | null = null;
    let scriptInfoOpen: ProtoScript | null = null;

    const dispatch = createEventDispatcher();

    const openEntry = (tabType: TabType) => {
        dispatch("action", { type: ActionType.OPEN, entry: tab?.entry!, tabType });
    };

    const loadClipboardScript = async () => {
        if (!navigator.clipboard) {
            toast.error("Error occurred", {
                description: `Could not copy from clipboard, feature not available.`,
            });
            return;
        }

        try {
            const data = await navigator.clipboard.readText();

            dispatch("action", {
                type: ActionType.SCRIPT_ADD,
                url: `data:text/javascript;base64,${window.btoa(data)}`,
            });
        } catch (e) {
            toast.error("Error occurred", {
                description: `Could not copy from clipboard, access denied.`,
            });
        }
    };
</script>

<Menubar class="window-controls rounded-none border-b border-none px-2 lg:px-4">
    <MenubarMenu>
        <MenubarTrigger class="font-bold">slicer</MenubarTrigger>
        <MenubarContent>
            <MenubarItem on:click={() => (aboutOpen = true)}>About</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>Theme</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarSub>
                        <MenubarSubTrigger inset>Color</MenubarSubTrigger>
                        <MenubarSubContent class="w-[12rem]">
                            <MenubarRadioGroup bind:value={$themeColor}>
                                {#each themes as theme (theme.name)}
                                    {@const activeColor =
                                        $mode === "light" ? theme.activeColor.light : theme.activeColor.dark}
                                    <MenubarRadioItem value={theme.name} class="justify-between">
                                        {theme.label || theme.name}
                                        <Circle
                                            size={16}
                                            style="stroke: hsl({activeColor}); fill: hsl({activeColor});"
                                        />
                                    </MenubarRadioItem>
                                {/each}
                            </MenubarRadioGroup>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSub>
                        <MenubarSubTrigger inset>Radius</MenubarSubTrigger>
                        <MenubarSubContent class="w-[12rem]">
                            <MenubarRadioGroup
                                value={$themeRadius.toString()}
                                onValueChange={(v) => ($themeRadius = parseFloat(v || "0.5"))}
                            >
                                <MenubarRadioItem value="0">None</MenubarRadioItem>
                                <MenubarRadioItem value="0.3">Small</MenubarRadioItem>
                                <MenubarRadioItem value="0.5">Normal</MenubarRadioItem>
                                <MenubarRadioItem value="0.75">Large</MenubarRadioItem>
                                <MenubarRadioItem value="1">Extra-large</MenubarRadioItem>
                            </MenubarRadioGroup>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarRadioGroup bind:value={$userPrefersMode}>
                        <MenubarRadioItem value="system" class="justify-between">
                            System <Settings size={16} />
                        </MenubarRadioItem>
                        <MenubarRadioItem value="dark" class="justify-between">
                            Dark <Moon size={16} />
                        </MenubarRadioItem>
                        <MenubarRadioItem value="light" class="justify-between">
                            Light <Sun size={16} />
                        </MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
                <MenubarSubTrigger>Preferences</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarItem
                        class="justify-between"
                        on:click={() => dispatch("action", { type: ActionType.PREFS_LOAD })}
                    >
                        Import <Upload size={16} />
                    </MenubarItem>
                    <MenubarItem
                        class="justify-between"
                        on:click={() => dispatch("action", { type: ActionType.PREFS_EXPORT })}
                    >
                        Export <Download size={16} />
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem class="justify-between" on:click={() => (prefsClearOpen = true)}>
                        Reset <MonitorX size={16} />
                    </MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">File</MenubarTrigger>
        <MenubarContent>
            <MenubarItem on:click={() => dispatch("action", { type: ActionType.LOAD })}>
                Open <Shortcut key="o" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem on:click={() => dispatch("action", { type: ActionType.ADD })}>
                Add <Shortcut key="o" modifier={Modifier.Ctrl | Modifier.Shift} />
            </MenubarItem>
            <MenubarItem disabled={entries.length === 0} on:click={() => (clearOpen = true)}>Clear all</MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled={!tab?.entry} on:click={() => dispatch("action", { type: ActionType.EXPORT })}>
                Export <Shortcut key="e" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem disabled={!tab?.entry} on:click={() => dispatch("action", { type: ActionType.CLOSE })}>
                Close <Shortcut key="w" modifier={Modifier.Ctrl | Modifier.Alt} />
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger>ZIP encoding</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$workspaceArchiveEncoding}>
                        {#each Object.values(encodings) as encoding}
                            <MenubarRadioItem value={encoding.id} class="justify-between">
                                {encoding.label || encoding.id.toUpperCase()}
                            </MenubarRadioItem>
                        {/each}
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">View</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger inset>Mode</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$viewMode}>
                        <MenubarRadioItem class="justify-between" value="normal">
                            Normal <Square size={16} />
                        </MenubarRadioItem>
                        <MenubarRadioItem class="justify-between" value="full_screen">
                            Full screen <Scan size={16} />
                        </MenubarRadioItem>
                        <MenubarRadioItem class="justify-between" value="distraction_free">
                            Distraction-free <SquareX size={16} />
                        </MenubarRadioItem>
                        <MenubarRadioItem class="justify-between" value="zen">
                            Zen <SquareCode size={16} />
                        </MenubarRadioItem>
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSub>
                <MenubarSubTrigger inset>Pane</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarCheckboxItem
                        class="justify-between"
                        disabled={$distractionFree}
                        bind:checked={$projectOpen}
                    >
                        Project <Folders size={16} />
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem
                        class="justify-between"
                        disabled={$distractionFree}
                        bind:checked={$loggingOpen}
                    >
                        Logging <Terminal size={16} />
                    </MenubarCheckboxItem>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem
                inset
                class="justify-between"
                disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.CODE}
                on:click={() => openEntry(TabType.CODE)}
            >
                Code <Code size={16} />
            </MenubarItem>
            <MenubarItem
                inset
                class="justify-between"
                disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.HEX}
                on:click={() => openEntry(TabType.HEX)}
            >
                Hexadecimal <Binary size={16} />
            </MenubarItem>
            <MenubarItem
                inset
                class="justify-between"
                disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.FLOW_GRAPH}
                on:click={() => openEntry(TabType.FLOW_GRAPH)}
            >
                Flow graph <GitBranchPlus size={16} />
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
                <MenubarSubTrigger inset>Encoding</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarRadioGroup bind:value={$workspaceEncoding}>
                        {#each Object.values(encodings) as encoding}
                            <MenubarRadioItem value={encoding.id} class="justify-between">
                                {encoding.label || encoding.id.toUpperCase()}
                            </MenubarRadioItem>
                        {/each}
                    </MenubarRadioGroup>
                </MenubarSubContent>
            </MenubarSub>
            <MenubarCheckboxItem class="justify-between" bind:checked={$editorWrap}>
                Wrap lines <WrapText size={16} />
            </MenubarCheckboxItem>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">Scripts</MenubarTrigger>
        <MenubarContent>
            <MenubarSub>
                <MenubarSubTrigger>Import</MenubarSubTrigger>
                <MenubarSubContent class="w-[12rem]">
                    <MenubarItem class="justify-between" on:click={() => (scriptLoadOpen = true)}>
                        From URL <Globe size={16} />
                    </MenubarItem>
                    <MenubarItem class="justify-between" on:click={loadClipboardScript}>
                        From clipboard <Clipboard size={16} />
                    </MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
            {#if scripts.length > 0}
                <MenubarSeparator />
                {#each scripts as proto (proto.id)}
                    <ScriptMenu
                        {proto}
                        on:action
                        on:open={(e) => (scriptInfoOpen = e.detail.proto)}
                        on:delete={(e) => (scriptDeleteOpen = e.detail.proto)}
                    />
                {/each}
            {/if}
        </MenubarContent>
    </MenubarMenu>
</Menubar>
<Separator />

<AboutDialog bind:open={aboutOpen} on:action />
<ScriptDialog bind:proto={scriptInfoOpen} on:action />
<ScriptLoadDialog bind:open={scriptLoadOpen} on:action />
<ScriptDeleteDialog bind:proto={scriptDeleteOpen} on:action />
<ClearDialog bind:open={clearOpen} on:action />
<PrefsClearDialog bind:open={prefsClearOpen} on:action />
