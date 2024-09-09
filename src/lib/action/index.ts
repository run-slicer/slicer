import type { Entry } from "$lib/workspace";
import type { Tab, TabType } from "$lib/tab";
import { handle } from "./handler";

export const enum ActionType {
    LOAD,
    ADD,
    CLEAR,
    OPEN,
    REMOVE,
    EXPORT,
    CLOSE,
}

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

export { handle };
