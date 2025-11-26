<script lang="ts" module>
    import { Type, FolderOpen, SquareActivity, Settings, SquareCode } from "@lucide/svelte";
    import GeneralSection from "./sections/general.svelte";
    import EditorSection from "./sections/editor.svelte";
    import WorkspaceSection from "./sections/workspace.svelte";
    import AnalysisSection from "./sections/analysis.svelte";
    import InterpSection from "./sections/interp.svelte";
    import type { Component } from "svelte";
    import type { Icon } from "$lib/components/icons";
    import { t } from "$lib/i18n";

    type SectionID = "general" | "editor" | "workspace" | "analysis" | "interp";
    interface Section {
        id: SectionID;
        icon: Icon;
        component: Component;
    }

    const sections: Section[] = [
        { id: "general", icon: Settings, component: GeneralSection },
        { id: "editor", icon: Type, component: EditorSection },
        { id: "workspace", icon: FolderOpen, component: WorkspaceSection },
        { id: "analysis", icon: SquareActivity, component: AnalysisSection },
        { id: "interp", icon: SquareCode, component: InterpSection },
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
    import { tl } from "$lib/i18n";

    let props: PaneProps = $props();

    let sectionsElem: HTMLElement | undefined = $state();
    let currentSection: SectionID | null = $state("general");
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
                        title={$t(`pane.prefs.section.${section.id}`)}
                    >
                        <SectionIcon />
                    </Button>
                </li>
            {/each}
        </ul>
        <div class="flex flex-col gap-2">
            <Button
                title={tl("pane.prefs.button.export")}
                size="icon"
                onclick={async () => {
                    await downloadBlob(
                        `slicer-${timestampFile()}.json`,
                        new Blob([save()], { type: "application/json" })
                    );
                    toast.success(tl("toast.success.title.export"), {
                        description: tl("toast.success.export-prefs"),
                    });
                }}
            >
                <Download />
            </Button>
            <Button
                title={tl("pane.prefs.button.import")}
                size="icon"
                variant="secondary"
                onclick={async () => {
                    const files = await readFiles(".json", false);
                    if (files.length > 0 && !load(await files[0].text())) {
                        toast.error(tl("toast.error.title.generic"), {
                            description: tl("toast.error.prefs-import"),
                        });
                    }
                }}
            >
                <Upload />
            </Button>
            <Button
                title={tl("pane.prefs.button.clear")}
                size="icon"
                variant="destructive"
                onclick={() => modals.open(PrefsClearDialog)}
            >
                <Eraser />
            </Button>
        </div>
    </div>
    <div class="bg-border my-8 w-px"></div>
    <div class="flex-1 scroll-p-8 overflow-y-auto p-8" bind:this={sectionsElem}>
        <div class="flex flex-col gap-6">
            {#each sections as { component: SectionComponent }}
                <SectionComponent {...props} />
            {/each}
        </div>
    </div>
</div>
