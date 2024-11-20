import type { Entry } from "$lib/workspace";
import type { Tab, TabType } from "$lib/tab";
import type { ProtoScript } from "$lib/script";
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
    type: ActionType.OPEN | ActionType.EXPORT;
    entry: Entry;
}

export interface BulkEntryAction extends Action {
    type: ActionType.REMOVE;
    entries: Entry[];
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

export { handle };
