<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { load, add } from "$lib/action";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { FilePlus2, Folder, Moon, Settings, Sun } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
</script>

<div class="m-24">
    <h1 class="mb-8 text-4xl font-semibold">Welcome</h1>
    <div class="flex max-w-lg flex-row flex-wrap justify-between gap-4">
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
