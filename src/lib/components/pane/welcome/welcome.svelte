<script lang="ts">
    import { mode, userPrefersMode } from "mode-watcher";
    import { FilePlus2, Folder, Moon, Settings, Sun, BookText, ScrollText } from "@lucide/svelte";
    import { ToggleGroup, ToggleGroupItem } from "$lib/components/ui/toggle-group";
    import { Button } from "$lib/components/ui/button";
    import type { PaneProps } from "$lib/components/pane";
    import { GitHub } from "$lib/components/icons";
    import { themeColor } from "$lib/state";
    import { themes } from "$lib/theme";
    import { t, tls } from "$lib/i18n";

    let { handler }: PaneProps = $props();

    const tips = tls("pane.welcome.tips");

    let tip = $state(Math.floor(Math.random() * $tips.length));
    const handleRevolver = (e: MouseEvent) => {
        // ignore click events coming from links
        if ((e.target as HTMLElement)?.tagName !== "A") {
            tip = tip === $tips.length - 1 ? 0 : tip + 1;
        }
    };
</script>

<div class="flex h-full flex-col overflow-y-auto p-24 pb-6">
    <h1 class="pb-8 text-4xl font-semibold">{$t("pane.welcome.title")}</h1>
    <div class="flex h-full flex-col justify-between">
        <div class="flex max-w-2xl flex-row flex-wrap justify-between gap-4">
            <div>
                <h2 class="text-muted-foreground text-lg font-medium">{$t("pane.welcome.get-started")}</h2>
                <div class="flex flex-col items-start">
                    <Button variant="link" class="h-8 !p-0" onclick={() => handler.load()}>
                        <Folder />
                        {$t("pane.welcome.get-started.open")}
                    </Button>
                    <Button variant="link" class="h-8 !p-0" onclick={() => handler.add()}>
                        <FilePlus2 />
                        {$t("pane.welcome.get-started.add")}
                    </Button>
                </div>
                <h2 class="text-muted-foreground pt-4 text-lg font-medium">{$t("pane.welcome.help")}</h2>
                <div class="flex flex-col items-start">
                    <Button variant="link" class="h-8 !p-0" onclick={() => window.open("https://docs.slicer.run")}>
                        <BookText />
                        {$t("pane.welcome.help.docs")}
                    </Button>
                    <Button
                        variant="link"
                        class="h-8 !p-0"
                        onclick={() => window.open("https://github.com/katana-project/slicer")}
                    >
                        <GitHub />
                        {$t("pane.welcome.help.contribute")}
                    </Button>
                    <Button
                        variant="link"
                        class="h-8 !p-0"
                        onclick={() => window.open("https://docs.oracle.com/javase/specs/jvms/se21/html/index.html")}
                    >
                        <ScrollText />
                        {$t("pane.welcome.help.jvms")}
                    </Button>
                </div>
            </div>
            <div>
                <h2 class="text-muted-foreground pb-2 text-lg font-medium">{$t("pane.welcome.customize")}</h2>
                <div class="flex flex-col gap-2">
                    <ToggleGroup
                        variant="outline"
                        class="w-full justify-start"
                        size="lg"
                        type="single"
                        bind:value={userPrefersMode.current}
                    >
                        <ToggleGroupItem value="system" aria-label={$t("pane.welcome.customize.theme.system")}>
                            <Settings class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="dark" aria-label={$t("pane.welcome.customize.theme.dark")}>
                            <Moon class="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="light" aria-label={$t("pane.welcome.customize.theme.light")}>
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
                        {@html $t("pane.welcome.customize.theme.desc")}
                    </p>
                </div>
            </div>
        </div>
        <div class="flex flex-row items-center justify-between gap-2 pt-8">
            <button class="cursor-help text-sm" onclick={handleRevolver}>
                <span class="text-accent-foreground/60 text-base font-medium">{$t("pane.welcome.tip")}</span>
                {@html $tips[tip]}
            </button>
            <a
                href="https://github.com/katana-project/slicer"
                target="_blank"
                aria-label="GitHub"
                class="hover:text-blue-600 hover:underline"
            >
                <GitHub size={24} />
            </a>
        </div>
    </div>
</div>
