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
import { analysisJdkClasses, scriptingScripts } from "$lib/state";
import {
    current as currentTab,
    find as findTab,
    open as openTab,
    openUnscoped as openUnscopedTab,
    refresh as refreshTab,
    type Tab,
    tabDefs,
    tabs,
    TabType,
} from "$lib/tab";
import { cyrb53 } from "$lib/utils";
import {
    type ClassEntry,
    classes,
    clear as clearWs,
    entries,
    type Entry,
    EntryType,
    load as loadEntry,
    remove as removeEntry,
} from "$lib/workspace";
import { AnalysisState, analyze } from "$lib/workspace/analysis";
import { DataType, memoryData, type MemoryData } from "$lib/workspace/data";
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
    Tab as ScriptTab,
    WorkspaceContext,
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
    return {
        _entry: e,
        get type() {
            return e.type;
        },
        name: e.name,
        bytes(): Promise<Uint8Array> {
            return e.data.bytes();
        },
        blob(): Promise<Blob> {
            return e.data.blob();
        },
    } as ScriptEntry;
};

const unwrapEntry = (e: ScriptEntry): Entry => {
    const entry = (e as any)._entry;
    if (entry) {
        return entry;
    }

    throw new Error("Could not unwrap script entry");
};

const wrapTab = (t: Tab): ScriptTab => {
    return {
        type: t.type,
        id: t.id,
        label: t.name,
        get position() {
            return t.position;
        },
        get active() {
            return Boolean(t.active);
        },
        entry: t.entry ? wrapEntry(t.entry) : null,
    };
};

const wrapDisasm = (disasm: Disassembler): ScriptDisassembler => {
    return {
        _disasm: disasm,
        id: disasm.id,
        label: disasm.name,
        version: disasm.version,
        language: disasm.language(),
        get options() {
            return disasm.options;
        },
        set options(options) {
            disasm.options = options;
        },

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
                warn(`script tried to disassemble non-class (disassembler id: ${disasm.id})`);
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
                      warn(`script tried to disassemble non-class (disassembler id: ${disasm.id})`);
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
    } as ScriptDisassembler;
};

const unwrapDisasm = (disasm: ScriptDisassembler): Disassembler => {
    const wrapped = (disasm as any)._disasm;
    if (wrapped) {
        return wrapped;
    }

    return {
        id: disasm.id,
        name: disasm.label,
        version: disasm.version,
        language(): Language {
            return disasm.language as Language;
        },
        get options() {
            return disasm.options;
        },
        set options(options) {
            disasm.options = options;
        },

        async class(entry: ClassEntry): Promise<string> {
            const { node, data } = entry;

            const buf = await data.bytes();
            const name = (node.pool[node.thisClass.name] as UTF8Entry).string;

            return disasm.class(name, createClassSource(get(classes), name, buf, get(analysisJdkClasses)));
        },
        method: disasm.method
            ? async (entry, method) => {
                  const { node, data } = entry;

                  const buf = await data.bytes();
                  const name = (node.pool[node.thisClass.name] as UTF8Entry).string;
                  const signature = method.name.string + method.type.string;

                  return disasm.method!(
                      name,
                      signature,
                      createClassSource(get(classes), name, buf, get(analysisJdkClasses))
                  );
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
    async refresh(id: string, hard: boolean = false) {
        const tab = findTab(id);
        if (tab) {
            await refreshTab(tab, hard);
        }
    },
    async add(type: string, entry?: ScriptEntry): Promise<ScriptTab> {
        const e = entry ? unwrapEntry(entry) : null;
        if (e) {
            const tabType = Object.keys(TabType).includes(type) ? (type as TabType) : undefined;
            if (!tabType) {
                warn("script wanted an invalid tab type, detecting a valid one for entry");
            }

            return wrapTab(await openTab(e, tabType));
        }

        const def = tabDefs.find((d) => d.type === type);
        if (def) {
            return wrapTab(openUnscopedTab(def));
        }

        throw new Error("Invalid tab type");
    },
    remove(id: string) {
        removeEntry(id);
    },
    clear() {
        clearWs();
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

const workspaceCtx: WorkspaceContext = {
    entries(): ScriptEntry[] {
        return Array.from(get(entries).values()).map(wrapEntry);
    },
    find(name: string): ScriptEntry | null {
        const entry = get(entries).get(name);
        return entry ? wrapEntry(entry) : null;
    },
    async add(name: string, data: Uint8Array | Blob): Promise<ScriptEntry> {
        const results = await loadEntry(memoryData(name, data));

        return wrapEntry(results.pop()!.entry);
    },
    remove(id: string) {
        removeEntry(id);
    },
    clear() {
        clearWs();
    },
};

const createContext = (script: Script, parent: ScriptContext | null): ScriptContext => {
    const scriptListeners = new Map<EventType, EventListener<any>[]>();

    return {
        script,
        parent,
        editor: editorCtx,
        disasm: disasmCtx,
        workspace: workspaceCtx,
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
