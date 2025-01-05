import { error } from "$lib/log";
import { persisted } from "$lib/utils";

export const root = "slicer.state";

export interface ScriptData {
    url: string;
    load: boolean;
}

export const themeColor = persisted<string>(`${root}.theme.color`, "zinc");
export const themeRadius = persisted<number>(`${root}.theme.radius`, 0.5);
export const workspaceEncoding = persisted<string>(`${root}.workspace.encoding`, "utf-8");
export const workspaceArchiveNested = persisted<boolean>(`${root}.workspace.archive.nested`, true);
export const workspaceArchiveEncoding = persisted<string>(`${root}.workspace.archive.encoding`, "utf-8");
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

export const clear = () => {
    localStorage.clear();
    window.location.reload();
};
