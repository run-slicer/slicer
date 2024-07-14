import { persisted } from "./store";
import cfr from "$lib/disasm/cfr";

const root = "slicer.state";

export type View = "auto" | "text" | "hex";

export const editorView = persisted<View>(`${root}.editor.view`, "auto");
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, cfr.id);
