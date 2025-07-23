<script lang="ts">
    import { mode, userPrefersMode } from "mode-watcher";
    import { Separator } from "$lib/components/ui/separator";
    import { analysisTransformers, type PaneData, themeColor, themeRadius, workspaceEncoding } from "$lib/state";
    import { type Entry, EntryType } from "$lib/workspace";
    import { encodings } from "$lib/workspace/encoding";
    import type { ProtoScript } from "$lib/script";
    import { type Tab, TabPosition, TabType, tabDefs } from "$lib/tab";
    import { Modifier } from "$lib/shortcut";
    import Shortcut from "./shortcut.svelte";
    import ScriptMenu from "./script/menu.svelte";
    import { AboutDialog, ClearDialog, ScriptLoadDialog } from "$lib/components/dialog";
    import {
        Menubar,
        MenubarCheckboxItem,
        MenubarContent,
        MenubarItem,
        MenubarMenu,
        MenubarRadioGroup,
        MenubarRadioItem,
        MenubarSeparator,
        MenubarSub,
        MenubarSubContent,
        MenubarSubTrigger,
        MenubarTrigger,
    } from "$lib/components/ui/menubar";
    import {
        Binary,
        BookOpen,
        Clipboard,
        Code,
        Coffee,
        FileCode2,
        GitBranchPlus,
        Globe,
        Info,
        Moon,
        Settings,
        Sun,
    } from "@lucide/svelte";
    import { themes } from "$lib/theme";
    import type { Disassembler } from "$lib/disasm";
    import type { EventHandler } from "$lib/event";
    import { type Transformer, toggle as toggleTransformer } from "$lib/workspace/analysis/transform";
    import PaneButton from "./pane_button.svelte";
    import { groupBy } from "$lib/utils";
    import { modals } from "svelte-modals";

    interface Props {
        panes: PaneData[];
        tab: Tab | null;
        entries: Entry[];
        classes: Entry[];
        scripts: ProtoScript[];
        disasms: Disassembler[];
        transformers: Transformer[];
        handler: EventHandler;
    }

    let { panes = $bindable(), tab, entries, classes, scripts, disasms, transformers, handler }: Props = $props();

    const updatePane = (position: TabPosition, open: boolean) => {
        let pane = panes.find((p) => p.position === position);
        if (!pane) {
            pane = { position, tabs: [], open };
            panes.push(pane);
        }

        pane.open = open;
        panes = panes; // force update
    };

    let primaryBottom = $derived({ current: panes.find((p) => p.position === TabPosition.PRIMARY_BOTTOM) });
    let secondaryLeft = $derived({ current: panes.find((p) => p.position === TabPosition.SECONDARY_LEFT) });
    let secondaryRight = $derived({ current: panes.find((p) => p.position === TabPosition.SECONDARY_RIGHT) });

    let entry = $derived(tab?.entry);

    let scriptShareUrl: string | null = $state(new URL(window.location.href).searchParams.get("script"));
    $effect(() => {
        if (!scriptShareUrl) {
            // clear search params on dialog close
            const url = new URL(window.location.href);
            url.searchParams.delete("script");
            window.history.replaceState(null, "", url);
        }
    });

    const openEntry = (tabType: TabType) => handler.open(entry!, tabType);

    const exportEntry = async () => {
        if (tab?.entry) {
            await handler.export([entry!]);
        }
    };

    const exportEntries = (disasm?: Disassembler) => handler.export(entries, disasm);

    const openPrefs = async () => {
        handler.openUnscoped(tabDefs.find((d) => d.type === TabType.PREFS)!, TabPosition.PRIMARY_CENTER);
    };
    const openSearch = async () => {
        updatePane(TabPosition.SECONDARY_RIGHT, true);
        handler.openUnscoped(tabDefs.find((d) => d.type === TabType.SEARCH)!, TabPosition.SECONDARY_RIGHT);
    };
</script>

<Menubar class="window-controls justify-between rounded-none border-b border-none px-2 lg:px-4">
    <div class="flex flex-row">
        <MenubarMenu>
            <MenubarTrigger class="font-bold">slicer</MenubarTrigger>
            <MenubarContent align="start">
                <MenubarItem class="justify-between" onclick={() => modals.open(AboutDialog)}>
                    About <Info size={16} />
                </MenubarItem>
                <MenubarItem class="justify-between" onclick={() => window.open("https://docs.slicer.run/", "_blank")}>
                    Documentation <BookOpen size={16} />
                </MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                    <MenubarSubTrigger>Theme</MenubarSubTrigger>
                    <MenubarSubContent class="min-w-[12rem]" align="start">
                        <MenubarSub>
                            <MenubarSubTrigger inset>Color</MenubarSubTrigger>
                            <MenubarSubContent align="start">
                                <MenubarRadioGroup bind:value={$themeColor}>
                                    {#each themes as theme (theme.name)}
                                        {@const cssVars =
                                            mode.current === "light" ? theme.cssVars.light : theme.cssVars.dark}
                                        <MenubarRadioItem value={theme.name} class="items-center justify-between gap-4">
                                            {theme.label || theme.name}
                                            <div
                                                class="size-4 rounded-full"
                                                style="background: conic-gradient({cssVars.primary}, {cssVars.secondary});"
                                            ></div>
                                        </MenubarRadioItem>
                                    {/each}
                                </MenubarRadioGroup>
                            </MenubarSubContent>
                        </MenubarSub>
                        <MenubarSub>
                            <MenubarSubTrigger inset>Radius</MenubarSubTrigger>
                            <MenubarSubContent align="start">
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
                        <MenubarRadioGroup bind:value={userPrefersMode.current}>
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
                <MenubarItem class="justify-between" onclick={openPrefs}>
                    Preferences <Settings size={16} />
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger class="relative">File</MenubarTrigger>
            <MenubarContent align="start">
                <MenubarItem onclick={() => handler.load()}>
                    Open <Shortcut key="o" modifier={Modifier.CTRL} />
                </MenubarItem>
                <MenubarItem onclick={() => handler.add()}>
                    Add <Shortcut key="o" modifier={Modifier.CTRL | Modifier.SHIFT} />
                </MenubarItem>
                <MenubarItem disabled={entries.length === 0} onclick={() => modals.open(ClearDialog, { handler })}>
                    Clear all
                </MenubarItem>
                <MenubarSub>
                    <MenubarSubTrigger disabled={entries.length === 0}>Export all</MenubarSubTrigger>
                    <MenubarSubContent class="min-w-[12rem]" align="start">
                        <MenubarItem class="justify-between" onclick={() => exportEntries()}>
                            Raw <Binary size={16} />
                        </MenubarItem>
                        <MenubarSub>
                            <MenubarSubTrigger disabled={classes.length === 0}>Disassembled</MenubarSubTrigger>
                            <MenubarSubContent class="min-w-[12rem]" align="start">
                                {#each disasms as dism}
                                    <MenubarItem class="justify-between" onclick={() => exportEntries(dism)}>
                                        {dism.name || dism.id}
                                        {#if dism.language() === "java"}
                                            <Coffee size={16} class="text-red-500" />
                                        {/if}
                                    </MenubarItem>
                                {/each}
                            </MenubarSubContent>
                        </MenubarSub>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem disabled={!tab?.entry} onclick={() => handler.close()}>
                    Close <Shortcut key="w" modifier={Modifier.CTRL | Modifier.ALT} />
                </MenubarItem>
                <MenubarItem disabled={!tab?.entry} onclick={exportEntry}>
                    Export <Shortcut key="e" modifier={Modifier.CTRL} />
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger class="relative">View</MenubarTrigger>
            <MenubarContent align="start">
                <MenubarItem
                    class="justify-between"
                    disabled={!tab?.entry || tab.type === TabType.CODE}
                    onclick={() => openEntry(TabType.CODE)}
                >
                    Code <Code size={16} />
                </MenubarItem>
                <MenubarItem
                    class="justify-between"
                    disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.CLASS}
                    onclick={() => openEntry(TabType.CLASS)}
                >
                    Class <FileCode2 size={16} />
                </MenubarItem>
                <MenubarItem
                    class="justify-between"
                    disabled={!tab?.entry || tab.entry.type === EntryType.ARCHIVE || tab.type === TabType.GRAPH}
                    onclick={() => openEntry(TabType.GRAPH)}
                >
                    Graph <GitBranchPlus size={16} />
                </MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                    <MenubarSubTrigger>Encoding</MenubarSubTrigger>
                    <MenubarSubContent class="min-w-[12rem]" align="start">
                        <MenubarRadioGroup bind:value={$workspaceEncoding}>
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
            <MenubarTrigger class="relative">Analysis</MenubarTrigger>
            <MenubarContent align="start">
                <MenubarItem class="justify-between" onclick={openSearch}>
                    Search <Shortcut key="f" modifier={Modifier.CTRL | Modifier.SHIFT} />
                </MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                    <MenubarSubTrigger disabled={!transformers.some((t) => !t.internal)}>
                        Transformers
                    </MenubarSubTrigger>
                    <MenubarSubContent class="min-w-[12rem]" align="start">
                        {@const groups = groupBy(
                            transformers.filter((t) => !t.internal),
                            (t) => t.group
                        )}
                        {#each groups.entries() as [group, trfs]}
                            <MenubarSub>
                                <MenubarSubTrigger>{group || "General"}</MenubarSubTrigger>
                                <MenubarSubContent class="min-w-[12rem]" align="start">
                                    {#each trfs as trf (trf.id)}
                                        {@const Icon = trf.icon}
                                        <MenubarCheckboxItem
                                            class="justify-between"
                                            checked={$analysisTransformers.includes(trf.id)}
                                            onCheckedChange={(checked) => toggleTransformer(trf, checked)}
                                        >
                                            {trf.name || trf.id}
                                            {#if Icon}<Icon size={16} class="ml-3" />{/if}
                                        </MenubarCheckboxItem>
                                    {/each}
                                </MenubarSubContent>
                            </MenubarSub>
                        {/each}
                    </MenubarSubContent>
                </MenubarSub>
            </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
            <MenubarTrigger class="relative">Scripts</MenubarTrigger>
            <MenubarContent align="start">
                <MenubarSub>
                    <MenubarSubTrigger>Import</MenubarSubTrigger>
                    <MenubarSubContent class="min-w-[12rem]" align="start">
                        <MenubarItem class="justify-between" onclick={() => modals.open(ScriptLoadDialog, { handler })}>
                            From URL <Globe size={16} />
                        </MenubarItem>
                        <MenubarItem class="justify-between" onclick={() => handler.addScript()}>
                            From clipboard <Clipboard size={16} />
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                {#if scripts.length > 0}
                    <MenubarSeparator />
                    {#each scripts as proto (proto.id)}
                        <ScriptMenu {proto} {handler} />
                    {/each}
                {/if}
                <MenubarSeparator />
                <MenubarItem
                    class="justify-between"
                    onclick={() => window.open("https://docs.slicer.run/script/", "_blank")}
                >
                    Documentation <BookOpen size={16} />
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    </div>
    <div class="flex flex-row">
        <PaneButton
            open={secondaryLeft.current?.open}
            title="Left pane"
            position={TabPosition.SECONDARY_LEFT}
            onchange={(open) => updatePane(TabPosition.SECONDARY_LEFT, open)}
        />
        <PaneButton
            open={secondaryRight.current?.open}
            title="Right pane"
            position={TabPosition.SECONDARY_RIGHT}
            onchange={(open) => updatePane(TabPosition.SECONDARY_RIGHT, open)}
        />
        <PaneButton
            open={primaryBottom.current?.open}
            title="Bottom pane"
            position={TabPosition.PRIMARY_BOTTOM}
            onchange={(open) => updatePane(TabPosition.PRIMARY_BOTTOM, open)}
        />
    </div>
</Menubar>
<Separator />

<style>
    /* PWA title bar */
    @media (display-mode: window-controls-overlay) {
        :global(.window-controls) {
            position: sticky;
            z-index: 9999;
            background-color: var(--background);

            left: env(titlebar-area-x, 0);
            top: env(titlebar-area-y, 0);
            width: env(titlebar-area-width, 100%);
            height: env(titlebar-area-height, 2.5rem);

            -webkit-app-region: drag;
            app-region: drag;
        }

        :global(.window-controls > *) {
            /* fix item height on smaller title bars */
            padding-top: 0;
            padding-bottom: 0;
            height: 100%;

            -webkit-app-region: no-drag;
            app-region: no-drag;
        }
    }
</style>
