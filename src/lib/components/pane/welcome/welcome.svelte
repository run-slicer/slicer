<script lang="ts" module>
    const tips = [
        `View our documentation at <a href="https://docs.slicer.run" target="_blank" class="text-blue-600 hover:text-blue-700 hover:underline">docs.slicer.run</a>!`,
        `Double-tap <span class="text-xs bg-muted rounded p-1">Shift</span> to view the command palette!`,
    ];

    export const nextTip = (tip: string): string => tips[tips.indexOf(tip) + 1] || tips[0];
    export const randomTip = (): string => tips[Math.floor(Math.random() * tips.length)];
</script>

<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { FilePlus2, Folder, Moon, Settings, Sun } from "lucide-svelte";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { Button } from "$lib/components/ui/button";
    import type { PaneProps } from "$lib/components/pane";
    import { GitHub } from "$lib/components/icons";

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
        <div class="flex max-w-lg flex-row flex-wrap justify-between gap-4">
            <div>
                <h2 class="text-lg font-medium text-muted-foreground">Get started</h2>
                <div class="flex flex-col items-start">
                    <Button variant="link" class="h-8 p-0" onclick={() => handler.load()}>
                        <Folder /> Open
                    </Button>
                    <Button variant="link" class="h-8 p-0" onclick={() => handler.add()}>
                        <FilePlus2 /> Add file
                    </Button>
                </div>
            </div>
            <div>
                <h2 class="pb-2 text-lg font-medium text-muted-foreground">Customize</h2>
                <ToggleGroup class="justify-start" type="single" bind:value={$userPrefersMode}>
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
            </div>
        </div>
        <div class="flex flex-row items-center justify-between gap-2 pt-8">
            <button class="cursor-help text-sm" onclick={handleRevolver}>
                <span class="text-base font-medium text-accent-foreground/60">Tip: </span>
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
