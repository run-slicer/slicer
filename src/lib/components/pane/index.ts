import type { Disassembler } from "$lib/disasm";
import type { EventHandler } from "$lib/event";
import type { LogEntry } from "$lib/log";
import type { Tab } from "$lib/tab";
import type { Entry } from "$lib/workspace";
import Pane from "./pane.svelte";
import RootPane from "./root.svelte";

export interface PaneProps {
    tab: Tab;
    entries: Entry[];
    logEntries: LogEntry[];
    disasms: Disassembler[];
    handler: EventHandler;
}

export { Pane, RootPane };
