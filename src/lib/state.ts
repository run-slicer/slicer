import { persisted } from "$lib/utils";
import { error } from "$lib/log";

export const root = "slicer.state";

export const enum ViewMode {
    NORMAL = "normal",
    FULL_SCREEN = "full_screen",
    DISTRACTION_FREE = "distraction_free",
    ZEN = "zen",
}

export interface ScriptData {
    url: string;
    load: boolean;
}

export const viewMode = persisted<ViewMode>(`${root}.view.mode`, ViewMode.NORMAL);
export const workspaceNestedArchives = persisted<boolean>(`${root}.workspace.nested-archives`, true);
export const projectOpen = persisted<boolean>(`${root}.project.open`, true);
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, "vf" /* vf.id ($lib/disasm/builtin) */);
export const loggingOpen = persisted<boolean>(`${root}.logging.open`, false);
export const loggingMaxEntries = persisted<number>(`${root}.logging.max-entries`, 50);
export const scriptingScripts = persisted<ScriptData[]>(`${root}.scripting.scripts`, []);
export const editorWrap = persisted<boolean>(`${root}.editor.wrap`, false);
export const editorTextSize = persisted<number>(`${root}.editor.text-size`, 0.75);
export const editorTextSizeSync = persisted<boolean>(`${root}.editor.text-size.sync`, true);

export const load = (data: string): boolean => {
    try {
        Object.entries(JSON.parse(data) as Record<string, string>).forEach(([k, v]) => localStorage.setItem(k, v));
    } catch (e) {
        error("failed to parse state", e);
        return false;
    }

    window.location.reload();
    return true;
};

export const save = (): string => {
    return JSON.stringify(localStorage, null, 2 /* pretty */);
};
