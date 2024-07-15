<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { load, add } from "$lib/action";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { FilePlus2, Folder, Moon, Settings, Sparkles, Sun } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { update as updateTab } from "$lib/tab";
    import { current as currentWs } from "$lib/workspace";
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    onMount(() => {
        updateTab({
            id: "slicer:welcome",
            name: "Welcome",
            icon: Sparkles,
            active: () => get(currentWs) === null,
            open: () => currentWs.set(null),
        });
    });
</script>

<div class="m-24">
    <h1 class="mb-8 text-4xl font-bold">Welcome</h1>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
            <h2 class="text-lg font-medium text-muted-foreground">Get started</h2>
            <div class="flex flex-col items-start">
                <Button variant="link" class="h-8 p-0" on:click={load}>
                    <Folder class="mr-2 h-4 w-4" /> Open
                </Button>
                <Button variant="link" class="h-8 p-0" on:click={add}>
                    <FilePlus2 class="mr-2 h-4 w-4" /> Add file
                </Button>
            </div>
        </div>
        <div>
            <h2 class="mb-2 text-lg font-medium text-muted-foreground">Customize</h2>
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
</div>
