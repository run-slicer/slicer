<script lang="ts" module>
    const tips = [
        `View our documentation at <a href="https://docs.slicer.run" target="_blank" class="text-blue-600 hover:text-blue-700 hover:underline">docs.slicer.run</a>!`,
        `Double-tap <span class="text-xs bg-muted rounded p-1">Shift</span> to view the command palette!`,
        "Open new panes using the buttons in the top right corner!",
        `If you're dealing with obfuscated classes, use <a href="https://docs.slicer.run/reference/analysis/#transformers" target="_blank" class="text-blue-600 hover:text-blue-700 hover:underline">the transformers</a>!`,
    ];

    export const nextTip = (tip: string): string => tips[tips.indexOf(tip) + 1] || tips[0];
    export const randomTip = (): string => tips[Math.floor(Math.random() * tips.length)];
</script>

<script lang="ts">
    import { mode, userPrefersMode } from "mode-watcher";
    import { FilePlus2, Folder, Moon, Settings, Sun, BookText, ScrollText } from "@lucide/svelte";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { Button } from "$lib/components/ui/button";
    import type { PaneProps } from "$lib/components/pane";
    import { GitHub } from "$lib/components/icons";
    import { themeColor } from "$lib/state";
    import { themes } from "$lib/theme";

    let { handler }: PaneProps = $props();

    let tip = $state(randomTip());
    const handleRevolver = (e: MouseEvent) => {
        // ignore click events coming from links
        if ((e.target as HTMLElement)?.tagName !== "A") {
            tip = nextTip(tip);
        }
    };
</script>

<div class="flex h-full flex-col overflow-y-auto p-24 pb-6">
    <h1 class="pb-8 text-4xl font-semibold">Welcome</h1>
    <div class="flex h-full flex-col justify-between">
        <div class="flex max-w-2xl flex-row flex-wrap justify-between gap-4">
            <div>
                <h2 class="text-muted-foreground text-lg font-medium">Get started</h2>
                <div class="flex flex-col items-start">
                    <Button variant="link" class="h-8 !p-0" onclick={() => handler.load()}>
                        <Folder /> Open JAR/ZIP file
                    </Button>
                    <Button variant="link" class="h-8 !p-0" onclick={() => handler.add()}>
                        <FilePlus2 /> Add file to workspace
                    </Button>
                </div>
                <h2 class="text-muted-foreground pt-4 text-lg font-medium">Help</h2>
                <div class="flex flex-col items-start">
                    <Button variant="link" class="h-8 !p-0" onclick={() => window.open("https://docs.slicer.run")}>
                        <BookText /> Read the docs
                    </Button>
                    <Button
                        variant="link"
                        class="h-8 !p-0"
                        onclick={() => window.open("https://github.com/run-slicer/slicer")}
                    >
                        <GitHub /> Contribute
                    </Button>
                    <Button
                        variant="link"
                        class="h-8 !p-0"
                        onclick={() => window.open("https://docs.oracle.com/javase/specs/jvms/se21/html/index.html")}
                    >
                        <ScrollText /> View the JVMS
                    </Button>
                </div>
            </div>
            <div>
                <h2 class="text-muted-foreground pb-2 text-lg font-medium">Customize</h2>
                <div class="flex flex-col gap-2">
                    <ToggleGroup
                        variant="outline"
                        class="w-full justify-start"
                        size="lg"
                        type="single"
                        bind:value={userPrefersMode.current}
                    >
                        <ToggleGroupItem value="system" aria-label="Toggle system-preferred theme">
                            <Settings class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="dark" aria-label="Toggle dark theme">
                            <Moon class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="light" aria-label="Toggle light theme">
                            <Sun class="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <ToggleGroup
                        variant="outline"
                        class="w-full justify-start"
                        size="lg"
                        type="single"
                        bind:value={$themeColor}
                    >
                        {#each themes.slice(0, 6) as theme (theme.name)}
                            {@const cssVars = mode.current === "light" ? theme.cssVars.light : theme.cssVars.dark}
                            <ToggleGroupItem value={theme.name} aria-label={theme.label || theme.name}>
                                <div
                                    class="size-4 rounded-full"
                                    style="background: conic-gradient({cssVars.primary}, {cssVars.secondary});"
                                ></div>
                            </ToggleGroupItem>
                        {/each}
                    </ToggleGroup>
                    <p class="text-muted-foreground text-xs">
                        ... check out more options in <span class="bg-muted rounded p-1">slicer</span> ->
                        <span class="bg-muted rounded p-1">Theme</span>
                    </p>
                </div>
            </div>
        </div>
        <div class="flex flex-row items-center justify-between gap-2 pt-8">
            <button class="cursor-help text-sm" onclick={handleRevolver}>
                <span class="text-accent-foreground/60 text-base font-medium">Tip: </span>
                {@html tip}
            </button>
            <a
                href="https://github.com/run-slicer/slicer"
                target="_blank"
                aria-label="GitHub"
                class="hover:text-blue-600 hover:underline"
            >
                <GitHub size={24} />
            </a>
        </div>
    </div>
</div>
