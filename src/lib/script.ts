import {
    add as addDisasm,
    all as disasms,
    type Disassembler,
    find as findDisasm,
    remove as removeDisasm,
} from "$lib/disasm";
import { createSource as createClassSource } from "$lib/disasm/source";
import type { Language } from "$lib/lang";
import { error, warn } from "$lib/log";
import { scriptingScripts } from "$lib/state";
import { current as currentTab, find as findTab, refresh as refreshTab, type Tab, tabs, TabType } from "$lib/tab";
import { cyrb53 } from "$lib/utils";
import { type ClassEntry, classes, type Entry, EntryType, readDeferred } from "$lib/workspace";
import { AnalysisState, analyze } from "$lib/workspace/analysis";
import { DataType, type MemoryData, unwrapTransform } from "$lib/workspace/data";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import type {
    DisassemblerContext,
    EditorContext,
    Event,
    EventListener,
    EventMap,
    EventType,
    Script,
    ScriptContext,
    Disassembler as ScriptDisassembler,
    Entry as ScriptEntry,
    EntryType as ScriptEntryType,
    Tab as ScriptTab,
    TabType as ScriptTabType,
} from "@run-slicer/script";
import { toast } from "svelte-sonner";
import { get, writable } from "svelte/store";

export const enum ScriptState {
    UNLOADED,
    LOADED,
    FAILED,
}

export interface ProtoScript {
    url: string;
    id: string; // computed based on url
    state: ScriptState;
    script: Script | null;
    context: ScriptContext | null;
}

export const scripts = writable<ProtoScript[]>([]);

const wrapEntry = (e: Entry): ScriptEntry => {
    let type: ScriptEntryType = "unspecific";
    switch (e.type) {
        case EntryType.CLASS:
        case EntryType.ARCHIVE:
            type = e.type;
            break;
    }

    return { type, name: e.name };
};

const wrapTab = (t: Tab): ScriptTab => {
    let type: ScriptTabType = "unspecific";
    switch (t.type) {
        case TabType.WELCOME:
        case TabType.CODE:
        case TabType.HEX:
        case TabType.FLOW_GRAPH:
        case TabType.IMAGE:
            type = t.type;
            break;
    }

    return {
        type,
        id: t.id,
        label: t.name,
        entry: t.entry ? wrapEntry(t.entry) : null,
    };
};

const wrapDisasm = (disasm: Disassembler): ScriptDisassembler => {
    return {
        id: disasm.id,
        label: disasm.name,
        language: disasm.language,

        async class(name, source): Promise<string> {
            const data = await source(name);
            if (!data) {
                return "";
            }

            // create simulated entry
            let entry: Entry = {
                type: EntryType.FILE,
                name: "",
                shortName: "",
                data: {
                    type: DataType.MEMORY,
                    name: "",
                    data,
                } as MemoryData,
                state: AnalysisState.NONE,
            };

            await analyze(entry, AnalysisState.FULL);
            if (entry.type !== EntryType.CLASS) {
                warn(`tried to disassemble non-class (disassembler id: ${disasm.id})`);
                return "";
            }

            return disasm.class(entry as ClassEntry);
        },
        method: disasm.method
            ? async (name, signature, source) => {
                  const data = await source(name);
                  if (!data) {
                      return "";
                  }

                  // create simulated entry
                  let entry: Entry = {
                      type: EntryType.FILE,
                      name: "",
                      shortName: "",
                      data: {
                          type: DataType.MEMORY,
                          name: "",
                          data,
                      } as MemoryData,
                      state: AnalysisState.NONE,
                  };

                  await analyze(entry, AnalysisState.FULL);
                  if (entry.type !== EntryType.CLASS) {
                      warn(`tried to disassemble non-class (disassembler id: ${disasm.id})`);
                      return "";
                  }

                  const classEntry = entry as ClassEntry;
                  const method = classEntry.node.methods.find((m) => {
                      return m.name.string + m.type.string === signature;
                  });
                  if (!method) {
                      return "";
                  }

                  return disasm.method!(classEntry, method);
              }
            : undefined,
    };
};

const unwrapDisasm = (disasm: ScriptDisassembler): Disassembler => {
    return {
        id: disasm.id,
        name: disasm.label,
        language: disasm.language as Language,

        async class(entry: ClassEntry): Promise<string> {
            const { node, data } = entry;

            const buf = await data.bytes();
            const name = (node.pool[node.thisClass.name] as UTF8Entry).string;

            const classes0 = get(classes);
            return disasm.class(name, createClassSource(classes0, name, buf));
        },
        method: disasm.method
            ? async (entry, method) => {
                  const { node, data } = entry;

                  const buf = await data.bytes();
                  const name = (node.pool[node.thisClass.name] as UTF8Entry).string;
                  const signature = method.name.string + method.type.string;

                  const classes0 = get(classes);
                  return disasm.method!(name, signature, createClassSource(classes0, name, buf));
              }
            : undefined,
    };
};

const editorCtx: EditorContext = {
    tabs(): ScriptTab[] {
        return Array.from(get(tabs).values()).map(wrapTab);
    },
    find(id: string): ScriptTab | null {
        const tab = findTab(id);
        return tab ? wrapTab(tab) : null;
    },
    current(): ScriptTab | null {
        const tab = get(currentTab);
        return tab ? wrapTab(tab) : null;
    },
    async refresh(id: string, hard: boolean) {
        const tab = findTab(id);
        if (tab) {
            if (hard && tab.entry) {
                // script wanted a hard refresh, make sure to trigger a preload event
                tab.entry = await readDeferred({
                    ...tab.entry,
                    type: EntryType.FILE,
                    // unwrap any transforms, a script may have touched the tab entry
                    data: unwrapTransform(tab.entry.data),
                });
            }

            refreshTab(tab);
        }
    },
};

const disasmCtx: DisassemblerContext = {
    all(): ScriptDisassembler[] {
        return Array.from(get(disasms).values()).map(wrapDisasm);
    },
    find(id: string): ScriptDisassembler | null {
        const disasm = findDisasm(id);
        return disasm ? wrapDisasm(disasm) : null;
    },
    add(disasm: ScriptDisassembler) {
        addDisasm(unwrapDisasm(disasm));
    },
    remove(id: string) {
        removeDisasm(id);
    },
};

const createContext = (script: Script, parent: ScriptContext | null): ScriptContext => {
    const scriptListeners = new Map<EventType, EventListener<any>[]>();

    return {
        script,
        parent,
        editor: editorCtx,
        disasm: disasmCtx,
        addEventListener<K extends EventType>(type: K, listener: EventListener<EventMap[K]>) {
            let listeners = scriptListeners.get(type);
            if (!listeners) {
                listeners = [];
                scriptListeners.set(type, listeners);
            }

            listeners.push(listener);
        },
        removeEventListener<K extends EventType>(type: K, listener: EventListener<EventMap[K]>) {
            const listeners = scriptListeners.get(type);
            if (!listeners) {
                return; // no listeners for type
            }

            if (listeners.length > 1) {
                scriptListeners.set(
                    type,
                    listeners.filter((l) => l !== listener)
                );
            } else {
                scriptListeners.delete(type);
            }
        },
        async dispatchEvent<E extends Event>(event: E): Promise<E> {
            const listeners = scriptListeners.get(event.type);
            if (listeners) {
                for (const listener of listeners) {
                    await listener(event, this);
                }
            }

            // no parent? we must be the root, propagate to scripts
            if (!this.parent) {
                for (const protoScript of get(scripts)) {
                    await protoScript.context?.dispatchEvent(event);
                }
            }
            return event;
        },
    };
};

export const rootContext = createContext(
    {
        name: "slicer scripting engine",
        load(_context: ScriptContext): void {},
        unload(_context: ScriptContext): void {},
    },
    null // parent
);

const read0 = async (url: string): Promise<ProtoScript> => {
    const id = cyrb53(url).toString(16);
    try {
        const script = (await import(/* @vite-ignore */ url)).default as Script;
        if (!script || !script.load || !script.unload) {
            throw new Error("Invalid script, missing required properties");
        }

        return { url, id, state: ScriptState.UNLOADED, script, context: null };
    } catch (e) {
        error("failed to read script", e);

        toast.error("Script failed", {
            description: `Failed to read script ${id}, check the console.`,
        });
    }

    return { url, id, state: ScriptState.FAILED, script: null, context: null };
};

export const read = async (url: string): Promise<ProtoScript> => {
    const script = await read0(url);
    scripts.update(($scripts) => {
        $scripts.push(script);
        return $scripts;
    });

    return script;
};

export const load = async (def: ProtoScript): Promise<void> => {
    if (def.state !== ScriptState.UNLOADED) {
        return; // no-op
    }

    try {
        def.context = createContext(def.script!, rootContext);
        await def.script!.load(def.context!);

        def.state = ScriptState.LOADED;
    } catch (e) {
        error("failed to load script", e);
        def.state = ScriptState.FAILED;

        toast.error("Script failed", {
            description: `Failed to load script ${def.id}, check the console.`,
        });
    }

    scripts.update(($scripts) => $scripts); // forcefully synchronize store
};

export const unload = async (def: ProtoScript): Promise<void> => {
    if (def.state !== ScriptState.LOADED) {
        return; // no-op
    }

    try {
        const context = def.context!;
        def.context = null; // prevent any events from being handled from this point on

        await def.script!.unload(context);

        def.state = ScriptState.UNLOADED;
    } catch (e) {
        error("failed to unload script", e);
        def.state = ScriptState.FAILED;

        toast.error("Script failed", {
            description: `Failed to unload script ${def.id}, check the console.`,
        });
    }

    scripts.update(($scripts) => $scripts); // forcefully synchronize store
};

export const remove = async (def: ProtoScript): Promise<void> => {
    await unload(def);
    scripts.update(($scripts) => $scripts.filter((s) => s.id !== def.id));
};

// script loading

Promise.all(
    get(scriptingScripts).map(async (s) => {
        const script = await read(s.url);
        if (s.load) {
            await load(script);
        }

        return script;
    })
).then(() => {
    // start synchronizing stores only after all scripts have tried to load
    scripts.subscribe(($scripts) => {
        scriptingScripts.update(() => {
            return $scripts.map((s) => ({ url: s.url, load: s.state === ScriptState.LOADED }));
        });
    });
});
