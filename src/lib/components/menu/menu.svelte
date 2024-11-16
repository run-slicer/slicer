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
    import { type ActionHandler, ActionType, type OpenAction, type ScriptAddAction } from "$lib/action";
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
    import { toast } from "svelte-sonner";
    import { themes } from "$lib/theme";

    interface Props {
        tab: Tab | null;
        entries: Entry[];
        scripts: ProtoScript[];
        onaction?: ActionHandler;
    }

    let { tab, entries, scripts, onaction }: Props = $props();

    let aboutOpen = $state(false);
    let clearOpen = $state(false);
    let prefsClearOpen = $state(false);

    let scriptLoadOpen = $state(false);
    let scriptDeleteOpen: ProtoScript | null = $state(null);
    let scriptInfoOpen: ProtoScript | null = $state(null);

    const openEntry = (tabType: TabType) => {
        onaction?.({ type: ActionType.OPEN, entry: tab?.entry!, tabType } as OpenAction);
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

            onaction?.({
                type: ActionType.SCRIPT_ADD,
                url: `data:text/javascript;base64,${window.btoa(data)}`,
            } as ScriptAddAction);
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
            <MenubarItem onclick={() => (aboutOpen = true)}>About</MenubarItem>
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
                    <MenubarItem class="justify-between" onclick={() => onaction?.({ type: ActionType.PREFS_LOAD })}>
                        Import <Upload size={16} />
                    </MenubarItem>
                    <MenubarItem class="justify-between" onclick={() => onaction?.({ type: ActionType.PREFS_EXPORT })}>
                        Export <Download size={16} />
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem class="justify-between" onclick={() => (prefsClearOpen = true)}>
                        Reset <MonitorX size={16} />
                    </MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
        </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
        <MenubarTrigger class="relative">File</MenubarTrigger>
        <MenubarContent>
            <MenubarItem onclick={() => onaction?.({ type: ActionType.LOAD })}>
                Open <Shortcut key="o" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem onclick={() => onaction?.({ type: ActionType.ADD })}>
                Add <Shortcut key="o" modifier={Modifier.Ctrl | Modifier.Shift} />
            </MenubarItem>
            <MenubarItem disabled={entries.length === 0} onclick={() => (clearOpen = true)}>Clear all</MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled={!tab?.entry} onclick={() => onaction?.({ type: ActionType.EXPORT })}>
                Export <Shortcut key="e" modifier={Modifier.Ctrl} />
            </MenubarItem>
            <MenubarItem disabled={!tab?.entry} onclick={() => onaction?.({ type: ActionType.CLOSE })}>
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
                onclick={() => openEntry(TabType.CODE)}
            >
                Code <Code size={16} />
            </MenubarItem>
            <MenubarItem
                inset
                class="justify-between"
                disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.HEX}
                onclick={() => openEntry(TabType.HEX)}
            >
                Hexadecimal <Binary size={16} />
            </MenubarItem>
            <MenubarItem
                inset
                class="justify-between"
                disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.FLOW_GRAPH}
                onclick={() => openEntry(TabType.FLOW_GRAPH)}
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
                    <MenubarItem class="justify-between" onclick={() => (scriptLoadOpen = true)}>
                        From URL <Globe size={16} />
                    </MenubarItem>
                    <MenubarItem class="justify-between" onclick={loadClipboardScript}>
                        From clipboard <Clipboard size={16} />
                    </MenubarItem>
                </MenubarSubContent>
            </MenubarSub>
            {#if scripts.length > 0}
                <MenubarSeparator />
                {#each scripts as proto (proto.id)}
                    <ScriptMenu
                        {proto}
                        {onaction}
                        onopen={(proto) => (scriptInfoOpen = proto)}
                        ondelete={(proto) => (scriptDeleteOpen = proto)}
                    />
                {/each}
            {/if}
        </MenubarContent>
    </MenubarMenu>
</Menubar>
<Separator />

<AboutDialog bind:open={aboutOpen} />
<ScriptDialog bind:proto={scriptInfoOpen} />
<ScriptLoadDialog bind:open={scriptLoadOpen} {onaction} />
<ScriptDeleteDialog bind:proto={scriptDeleteOpen} {onaction} />
<ClearDialog bind:open={clearOpen} {onaction} />
<PrefsClearDialog bind:open={prefsClearOpen} {onaction} />
