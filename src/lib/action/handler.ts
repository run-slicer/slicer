import { type Action, ActionType, type BulkEntryAction, type EntryAction, type OpenAction, type TabAction } from "./";
import { load } from "./load";
import { add } from "./add";
import { open } from "./open";
import { remove } from "./remove";
import { export_ } from "./export";
import { clear } from "./clear";
import { close } from "./close";

export const handle = async (action: Action) => {
    switch (action.type) {
        case ActionType.LOAD: {
            return load();
        }
        case ActionType.ADD: {
            return add();
        }
        case ActionType.CLEAR: {
            return clear();
        }
        case ActionType.OPEN: {
            const openAction = action as OpenAction;

            return open(openAction.entry, openAction.tabType);
        }
        case ActionType.REMOVE: {
            const removeAction = action as BulkEntryAction;

            return remove(removeAction.entries);
        }
        case ActionType.EXPORT: {
            const exportAction = action as EntryAction;

            return export_(exportAction.entry);
        }
        case ActionType.CLOSE: {
            const closeAction = action as TabAction;

            return close(closeAction.tab);
        }
    }
};
