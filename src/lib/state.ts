import { persisted } from "./store";
import cfr from "$lib/disasm/cfr";

const root = "slicer.state";

export type View = "auto" | "text" | "hex";

export const editorView = persisted<View>(`${root}.editor.view`, "auto");
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, cfr.id);
export const loggingOpen = persisted<boolean>(`${root}.logging.open`, false);
export const loggingMaxEntries = persisted<number>(`${root}.logging.max-entries`, 50);
