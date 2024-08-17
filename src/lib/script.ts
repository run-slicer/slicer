import { addToast } from "$lib/components/toaster.svelte";
import { get, writable } from "svelte/store";
import type { Event, EventListener, EventMap, EventType, Script, ScriptContext } from "@run-slicer/script";
import { error } from "$lib/logging";
import { scriptingScripts } from "$lib/state";
import { cyrb53 } from "$lib/hash";

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

const createContext = (script: Script, parent: ScriptContext | null): ScriptContext => {
    const scriptListeners = new Map<EventType, EventListener<any>[]>();

    return {
        script,
        parent,
        addEventListener<K extends EventType>(type: K, listener: EventListener<EventMap[K]>) {
            const listeners = scriptListeners.get(type) || [];
            if (!listeners) {
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
            if (!listeners) {
                return event; // no listeners for type
            }

            for (const listener of listeners) {
                await listener(event, this);
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
        id: "slicer",
        name: "slicer scripting engine",
        version: process.env.APP_VERSION,
        load(_context: ScriptContext): void {},
        unload(_context: ScriptContext): void {},
    },
    null // parent
);

const read0 = async (url: string): Promise<ProtoScript> => {
    try {
        const script = (await import(url)).default as Script;
        if (!script || !script.id || !script.load || !script.unload) {
            throw new Error("Invalid script, missing required properties");
        }

        return { url, id: cyrb53(url).toString(16), state: ScriptState.UNLOADED, script, context: null };
    } catch (e) {
        error("failed to read script", e);
    }

    return { url, id: cyrb53(url).toString(16), state: ScriptState.FAILED, script: null, context: null };
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
        await def.script!.load(def.context!);

        def.state = ScriptState.LOADED;
        def.context = createContext(def.script!, rootContext);
    } catch (e) {
        error("failed to load script", e);
        def.state = ScriptState.FAILED;
    }

    scripts.update(($scripts) => $scripts); // forcefully synchronize store
};

export const unload = async (def: ProtoScript): Promise<void> => {
    if (def.state !== ScriptState.LOADED) {
        return; // no-op
    }

    try {
        await def.script!.unload(def.context!);

        def.state = ScriptState.UNLOADED;
        def.context = null;
    } catch (e) {
        error("failed to unload script", e);
        def.state = ScriptState.FAILED;
    }

    scripts.update(($scripts) => $scripts); // forcefully synchronize store
};

// script loading

const scriptPromises = get(scriptingScripts).map(async (s) => {
    const script = await read(s.url);
    if (s.load) {
        await load(script);
    }

    return script;
});

Promise.all(scriptPromises).then((scripts0) => {
    for (const protoScript of scripts0) {
        const script = protoScript.script;

        if (protoScript.state === ScriptState.FAILED) {
            addToast({
                title: "Script failed",
                description:
                    "Failed to " + (script ? `load script ${script.id}` : `read a script`) + ", check the console.",
                variant: "destructive",
            });
        }
    }

    // start synchronizing stores only after all scripts have tried to load
    scripts.subscribe(($scripts) => {
        scriptingScripts.update(() => {
            return $scripts.map((s) => ({ url: s.url, load: s.state === ScriptState.LOADED }));
        });
    });
});
