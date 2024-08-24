<script lang="ts">
    import { userPrefersMode } from "mode-watcher";
    import { load, add } from "$lib/action";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { FilePlus2, Folder, Moon, Settings, Sun } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
</script>

<div class="m-24 h-full">
    <h1 class="mb-8 text-4xl font-semibold">Welcome</h1>
    <div class="flex h-full flex-col justify-between">
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
        <div class="flex flex-row items-center justify-between">
            <div class="text-sm">
                <span class="text-base font-semibold text-muted-foreground">Tip: </span>
                View our documentation at
                <a
                    href="https://docs.slicer.run"
                    target="_blank"
                    class="text-blue-500 hover:text-blue-600 hover:underline">docs.slicer.run</a
                >!
            </div>
            <a href="https://github.com/run-slicer/slicer" target="_blank" class="hover:text-blue-600 hover:underline">
                <!-- Lucide's GitHub icon is deprecated, inline -->
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide-icon lucide"
                >
                    <path
                        d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
                    ></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
            </a>
        </div>
    </div>
</div>
