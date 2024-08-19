import { persisted } from "./store";
import cfr from "$lib/disasm/cfr";

const root = "slicer.state";

export interface ScriptData {
    url: string;
    load: boolean;
}

export const projectOpen = persisted<boolean>(`${root}.project.open`, true);
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, cfr.id);
export const loggingOpen = persisted<boolean>(`${root}.logging.open`, false);
export const loggingMaxEntries = persisted<number>(`${root}.logging.max-entries`, 50);
export const scriptingScripts = persisted<ScriptData[]>(`${root}.scripting.scripts`, []);
