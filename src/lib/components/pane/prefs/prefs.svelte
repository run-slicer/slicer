<script lang="ts" module>
    import { Paintbrush, Type, FolderOpen, SquareActivity } from "@lucide/svelte";
    import ThemeSection from "./sections/theme.svelte";
    import EditorSection from "./sections/editor.svelte";
    import WorkspaceSection from "./sections/workspace.svelte";
    import AnalysisSection from "./sections/analysis.svelte";
    import type { Component } from "svelte";
    import type { Icon } from "$lib/components/icons";

    type SectionID = "theme" | "editor" | "workspace" | "analysis";
    interface Section {
        id: SectionID;
        label: string;
        icon: Icon;
        component: Component;
    }

    const sections: Section[] = [
        { id: "theme", label: "Theme", icon: Paintbrush, component: ThemeSection },
        { id: "editor", label: "Editor", icon: Type, component: EditorSection },
        { id: "workspace", label: "Workspace", icon: FolderOpen, component: WorkspaceSection },
        { id: "analysis", label: "Analysis", icon: SquareActivity, component: AnalysisSection },
    ];
</script>

<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Upload, Download, Eraser } from "@lucide/svelte";
    import { load, save } from "$lib/state";
    import type { PaneProps } from "$lib/components/pane";
    import { downloadBlob, readFiles, timestampFile } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { modals } from "svelte-modals";
    import { PrefsClearDialog } from "$lib/components/dialog";

    let _: PaneProps = $props();

    let sectionsElem: HTMLElement | undefined = $state();
    let currentSection: SectionID | null = $state("theme");
    const scrollToSection = (id: SectionID) => {
        currentSection = id;
        sectionsElem?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: "smooth" });
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
    <div class="flex-1 scroll-p-8 overflow-y-auto p-8" bind:this={sectionsElem}>
        <div class="flex flex-col gap-6">
            {#each sections as { component: SectionComponent }}
                <SectionComponent />
            {/each}
        </div>
    </div>
</div>
