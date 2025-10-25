<script lang="ts">
    import { Switch } from "$lib/components/ui/switch";
    import { Select, SelectTrigger, SelectContent, SelectItem } from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";
    import { Slider } from "$lib/components/ui/slider";
    import { Button } from "$lib/components/ui/button";
    import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "$lib/components/ui/tooltip";
    import {
        Paintbrush,
        Type,
        FolderOpen,
        Upload,
        Download,
        Eraser,
        SquareActivity,
        CircleQuestionMark,
        CircleAlert,
    } from "@lucide/svelte";
    import {
        themeColor,
        themeRadius,
        editorWrap,
        editorTextSize,
        editorTextSizeSync,
        workspaceEncoding,
        workspaceArchiveEncoding,
        analysisBackground,
        analysisJdkClasses,
        load,
        save,
        interpHexRowBytes,
    } from "$lib/state";
    import { encodings } from "$lib/workspace/encoding";
    import { themes } from "$lib/theme";
    import type { PaneProps } from "$lib/components/pane";
    import { mode } from "mode-watcher";
    import { downloadBlob, readFiles, timestampFile } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { modals } from "svelte-modals";
    import PrefsClearDialog from "$lib/components/dialog/prefs_clear.svelte";
    import { Input } from "$lib/components/ui/input";
    import { Alert, AlertTitle } from "$lib/components/ui/alert";

    let _: PaneProps = $props();
    let currentSection: string | null = $state("theme");

    const sections = [
        { id: "theme", label: "Theme", icon: Paintbrush },
        { id: "editor", label: "Editor", icon: Type },
        { id: "workspace", label: "Workspace", icon: FolderOpen },
        { id: "analysis", label: "Analysis", icon: SquareActivity },
    ];

    const scrollToSection = (id: string) => {
        currentSection = id;
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };
</script>

<div class="mx-auto flex h-full w-full">
    <div class="flex flex-col justify-between gap-2 overflow-y-auto p-8">
        <ul class="flex flex-col gap-2 text-sm">
            {#each sections as section}
                {@const SectionIcon = section.icon}
                <li>
                    <Button
                        size="icon"
                        variant={currentSection === section.id ? "secondary" : "ghost"}
                        onclick={() => scrollToSection(section.id)}
                        title={section.label}
                    >
                        <SectionIcon />
                    </Button>
                </li>
            {/each}
        </ul>
        <div class="flex flex-col gap-2">
            <Button
                title="Export"
                size="icon"
                onclick={async () => {
                    await downloadBlob(
                        `slicer-${timestampFile()}.json`,
                        new Blob([save()], { type: "application/json" })
                    );
                    toast.success("Exported", {
                        description: `Preferences exported successfully.`,
                    });
                }}
            >
                <Download />
            </Button>
            <Button
                title="Import"
                size="icon"
                variant="secondary"
                onclick={async () => {
                    const files = await readFiles(".json", false);
                    if (files.length > 0 && !load(await files[0].text())) {
                        toast.error("Error occurred", {
                            description: `Could not import preferences, failed to read file.`,
                        });
                    }
                }}
            >
                <Upload />
            </Button>
            <Button title="Clear" size="icon" variant="destructive" onclick={() => modals.open(PrefsClearDialog)}>
                <Eraser />
            </Button>
        </div>
    </div>
    <div class="bg-border my-8 w-[1px]"></div>
    <div class="flex-1 scroll-p-8 overflow-y-auto p-8">
        <div class="flex flex-col gap-6">
            <div id="theme" class="space-y-3">
                <h2 class="border-b pb-2 text-lg font-semibold">Theme</h2>
                <div class="grid gap-2">
                    <div class="grid min-h-[2rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <Label for="themeColor">Color</Label>
                        <Select type="single" bind:value={$themeColor}>
                            <SelectTrigger class="w-48">
                                {themes.find((t) => t.name === $themeColor)?.label || $themeColor}
                            </SelectTrigger>
                            <SelectContent>
                                {#each themes as theme (theme.name)}
                                    {@const cssVars =
                                        mode.current === "light" ? theme.cssVars.light : theme.cssVars.dark}
                                    <SelectItem value={theme.name} class="items-center gap-2">
                                        <div
                                            class="size-4 rounded-full"
                                            style="background: conic-gradient({cssVars.primary}, {cssVars.secondary});"
                                        ></div>
                                        {theme.label || theme.name}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="themeRadius">Radius</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Alters the smoothness of UI corners.</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Slider
                            type="single"
                            id="themeRadius"
                            min={0}
                            max={1}
                            step={0.05}
                            bind:value={$themeRadius}
                            class="w-48"
                        />
                    </div>
                </div>
            </div>

            <div id="editor" class="space-y-3">
                <h2 class="border-b pb-2 text-lg font-semibold">Editor</h2>
                <div class="grid gap-2">
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="editorWrap">Word wrap</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Wraps long lines in the editor.</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Switch id="editorWrap" bind:checked={$editorWrap} />
                    </div>
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="editorTextSize">Text size</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Adjusts the default editor font size.</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Slider
                            type="single"
                            id="editorTextSize"
                            min={0.5}
                            max={1.5}
                            step={0.05}
                            bind:value={$editorTextSize}
                            class="w-48"
                        />
                    </div>
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="editorTextSizeSync">Sync text size</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right"
                                        >Synchronizes text size across all editors.</TooltipContent
                                    >
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Switch id="editorTextSizeSync" bind:checked={$editorTextSizeSync} />
                    </div>
                </div>
            </div>

            <div id="workspace" class="space-y-3">
                <h2 class="border-b pb-2 text-lg font-semibold">Workspace</h2>
                <div class="grid gap-2">
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <Label for="workspaceEncoding">File encoding</Label>
                        <Select type="single" bind:value={$workspaceEncoding}>
                            <SelectTrigger class="w-48">
                                {encodings[$workspaceEncoding]?.label || $workspaceEncoding.toUpperCase()}
                            </SelectTrigger>
                            <SelectContent>
                                {#each Object.values(encodings) as encoding}
                                    <SelectItem value={encoding.id}>
                                        {encoding.label || encoding.id.toUpperCase()}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="workspaceArchiveEncoding">Archive encoding</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Default encoding for ZIP archive data.</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Select type="single" bind:value={$workspaceArchiveEncoding}>
                            <SelectTrigger class="w-48">
                                {encodings[$workspaceArchiveEncoding]?.label || $workspaceArchiveEncoding.toUpperCase()}
                            </SelectTrigger>
                            <SelectContent>
                                {#each Object.values(encodings) as encoding}
                                    <SelectItem value={encoding.id}>
                                        {encoding.label || encoding.id.toUpperCase()}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <h2 class="border-b py-2 font-semibold">Interpretation</h2>
                <div class="grid gap-2">
                    <Alert variant="destructive">
                        <CircleAlert />
                        <AlertTitle
                            >Changes to these settings will cause all open entries to be reinterpreted!</AlertTitle
                        >
                    </Alert>
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="bytesPerRow">Bytes per row</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Number of bytes displayed per row in the hexadecimal interpretation mode.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Input id="bytesPerRow" type="number" bind:value={$interpHexRowBytes} class="w-48" />
                    </div>
                </div>
            </div>

            <div id="analysis" class="space-y-3">
                <h2 class="border-b pb-2 text-lg font-semibold">Analysis</h2>
                <div class="grid gap-2">
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="analysisBackground">Background analysis</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Whether analysis should run in the background or on-demand.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Switch id="analysisBackground" bind:checked={$analysisBackground} />
                    </div>
                    <div class="grid min-h-[2.5rem] grid-cols-[12rem_10rem_1fr] items-center gap-4">
                        <TooltipProvider>
                            <div class="flex items-center gap-2">
                                <Label for="analysisJdkClasses">Fetch JDK classes</Label>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <CircleQuestionMark class="text-muted-foreground h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Whether JDK classes should be made available to disassemblers (improves output
                                        quality).
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <Switch id="analysisJdkClasses" bind:checked={$analysisJdkClasses} />
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
