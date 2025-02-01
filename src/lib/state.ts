import { error } from "$lib/log";
import type { TabPosition, TabType } from "$lib/tab";
import { persisted } from "$lib/utils";

export const root = "slicer.state";

export interface ScriptData {
    url: string;
    load: boolean;
}

export interface OpenedPane {
    type: TabType;
    position: TabPosition;
    active: boolean;
}

export const themeColor = persisted<string>(`${root}.theme.color`, "zinc");
export const themeRadius = persisted<number>(`${root}.theme.radius`, 0.5);
export const workspaceEncoding = persisted<string>(`${root}.workspace.encoding`, "utf-8");
export const workspaceArchiveEncoding = persisted<string>(`${root}.workspace.archive.encoding`, "utf-8");
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, "vf" /* vf.id ($lib/disasm/builtin) */);
export const loggingMaxEntries = persisted<number>(`${root}.logging.max-entries`, 150);
export const scriptingScripts = persisted<ScriptData[]>(`${root}.scripting.scripts`, []);
export const editorWrap = persisted<boolean>(`${root}.editor.wrap`, true);
export const editorTextSize = persisted<number>(`${root}.editor.text-size`, 0.75);
export const editorTextSizeSync = persisted<boolean>(`${root}.editor.text-size.sync`, true);
export const analysisBackground = persisted<boolean>(`${root}.analysis.background`, true);

export const panePrimaryBottom = persisted<boolean>(`${root}.pane.primary.bottom`, false);
export const paneSecondaryLeft = persisted<boolean>(`${root}.pane.secondary.left`, true);
export const paneSecondaryRight = persisted<boolean>(`${root}.pane.secondary.right`, false);
export const paneOpened = persisted<OpenedPane[]>(`${root}.pane.opened`, [
    { type: "project" as TabType, position: "secondary_left" as TabPosition, active: true },
    { type: "welcome" as TabType, position: "primary_center" as TabPosition, active: true },
]);

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

export const clear = () => {
    localStorage.clear();
    window.location.reload();
};
