import type { Disassembler } from "$lib/disasm";
import type { ProtoScript } from "$lib/script";
import type { Tab, TabType } from "$lib/tab";
import type { Entry } from "$lib/workspace";
import { handle } from "./handler";

export const enum ActionType {
    LOAD,
    ADD,
    CLEAR,
    OPEN,
    REMOVE,
    EXPORT,
    CLOSE,
    SCRIPT_ADD,
    SCRIPT_LOAD,
    SCRIPT_UNLOAD,
    SCRIPT_REMOVE,
    PREFS_LOAD,
    PREFS_EXPORT,
    PREFS_CLEAR,
}

export type ActionHandler = (action: Action) => void;

export interface Action {
    type: ActionType;
}

export interface EntryAction extends Action {
    type: ActionType.OPEN;
    entry: Entry;
}

export interface BulkEntryAction extends Action {
    type: ActionType.REMOVE | ActionType.EXPORT;
    entries?: Entry[];
}

export interface OpenAction extends EntryAction {
    type: ActionType.OPEN;
    tabType?: TabType;
}

export interface TabAction extends Action {
    type: ActionType.CLOSE;
    tab?: Tab;
}

export interface ScriptAddAction extends Action {
    type: ActionType.SCRIPT_ADD;
    url: string;
}

export interface ScriptAction extends Action {
    type: ActionType.SCRIPT_LOAD | ActionType.SCRIPT_UNLOAD | ActionType.SCRIPT_REMOVE;
    proto: ProtoScript;
}

export interface ExportAction extends BulkEntryAction {
    type: ActionType.EXPORT;
    disasm?: Disassembler;
}

export { handle };
