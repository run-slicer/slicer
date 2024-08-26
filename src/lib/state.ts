import { persisted } from "./store";
import vf from "$lib/disasm/vf";

const root = "slicer.state";

export interface ScriptData {
    url: string;
    load: boolean;
}

export const projectOpen = persisted<boolean>(`${root}.project.open`, true);
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, vf.id);
export const loggingOpen = persisted<boolean>(`${root}.logging.open`, false);
export const loggingMaxEntries = persisted<number>(`${root}.logging.max-entries`, 50);
export const scriptingScripts = persisted<ScriptData[]>(`${root}.scripting.scripts`, []);
export const editorTextSize = persisted<number>(`${root}.editor.text-size`, 0.75);
export const editorTextSizeSync = persisted<boolean>(`${root}.editor.text-size.sync`, true);
