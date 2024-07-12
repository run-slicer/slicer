import { persisted } from "./store";
import cfr from "./decompiler/cfr";

export interface Tool {
    id: string;
    options?: Record<string, string>;
}

export interface Tools {
    decompiler: Tool;
}

export interface Config {
    view: "text" | "hex";
    tools: Tools;
}

export const current = persisted<Config>("slicer-config", {
    view: "text",
    tools: {
        decompiler: {
            id: cfr.id,
        },
    },
});
