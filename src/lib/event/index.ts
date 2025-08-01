import type { Disassembler } from "$lib/disasm";
import type { ProtoScript } from "$lib/script";
import type { Tab, TabDefinition, TabPosition, TabType } from "$lib/tab";
import type { Entry } from "$lib/workspace";
import { writable } from "svelte/store";
import defaultHandler from "./handler";

type Awaitable<T> = T | PromiseLike<T>;

export interface EventHandler {
    load(): Awaitable<void>;
    add(files?: File[]): Awaitable<void>;
    addRemote(url: string): Awaitable<void>;
    clear(): Awaitable<void>;
    open(entry: Entry, tabType?: TabType): Awaitable<void>;
    openUnscoped(def: TabDefinition, position: TabPosition, move: boolean): Awaitable<void>;
    remove(entries: Entry[]): Awaitable<void>;
    export(entries?: Entry[], disasm?: Disassembler): Awaitable<void>;
    close(tab?: Tab): Awaitable<void>;

    addScript(url?: string, load?: boolean): Awaitable<void>;
    loadScript(proto: ProtoScript): Awaitable<void>;
    unloadScript(proto: ProtoScript): Awaitable<void>;
    removeScript(proto: ProtoScript): Awaitable<void>;
}

export const handler = writable<EventHandler>(defaultHandler);
