import { persisted } from "./store";
import cfr from "$lib/disasm/cfr";

const root = "slicer.state";

export type View = "text" | "hex";

export const view = persisted<View>(`${root}.view`, "text");
export const toolsDisasm = persisted<string>(`${root}.tools.disasm`, cfr.id);
