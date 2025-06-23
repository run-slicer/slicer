import type { Disassembler } from "$lib/disasm";
import type { EventHandler } from "$lib/event";
import type { LogEntry } from "$lib/log";
import type { Tab } from "$lib/tab";
import type { Entry } from "$lib/workspace";
import Pane from "./pane.svelte";
import RootPane from "./root.svelte";

export interface PaneAccess {
    entries: Entry[];
    classes: Map<string, Entry>;
    logEntries: LogEntry[];
    disasms: Disassembler[];
    handler: EventHandler;
}

export interface PaneProps extends PaneAccess {
    tab: Tab;
}

export { Pane, RootPane };
