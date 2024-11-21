import { ActionType, handle } from "$lib/action";

// https://stackoverflow.com/questions/38241480/detect-macos-ios-windows-android-and-linux-os-with-js
const isMac = /Macintosh|Mac OS|MacIntel|MacPPC|Mac68K/gi.test(navigator.userAgent);

export const enum Modifier {
    CTRL = 1 << 0,
    SHIFT = 1 << 1,
    ALT = 1 << 2,
}

type ShortcutCallback = (e: KeyboardEvent) => void;
export type DestroyCallback = () => void;

const listen = (key: string, mod: number, callback: ShortcutCallback): DestroyCallback => {
    const checks: ((e: KeyboardEvent) => boolean)[] = [(e) => e.key.toLowerCase() === key];
    if ((mod & Modifier.CTRL) !== 0) {
        checks.push((e) => e.getModifierState(isMac ? "Meta" : "Control"));
    }
    if ((mod & Modifier.ALT) !== 0) {
        checks.push((e) => e.getModifierState("Alt"));
    }
    if ((mod & Modifier.SHIFT) !== 0) {
        checks.push((e) => e.getModifierState("Shift"));
    }

    const handler: ShortcutCallback = (e) => {
        if (checks.every((check) => check(e))) {
            e.preventDefault();
            e.stopPropagation();

            callback(e);
        }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
};

const listenAction = (key: string, mod: number, action: ActionType): DestroyCallback => {
    return listen(key, mod, () => handle({ type: action }));
};

export const register = (): DestroyCallback => {
    // order matters, shortcuts with (more) modifiers should be registered earlier

    const callbacks = [
        listenAction("o", Modifier.CTRL | Modifier.SHIFT, ActionType.ADD),
        listenAction("o", Modifier.CTRL, ActionType.LOAD),
        listenAction("w", Modifier.CTRL | Modifier.ALT, ActionType.CLOSE),
        listenAction("e", Modifier.CTRL, ActionType.EXPORT),
    ];
    return () => callbacks.forEach((c) => c());
};

export const format = (key: string, mod: number): string => {
    if (isMac) {
        return formatMac(key, mod);
    }

    let keys: string[] = [];
    if ((mod & Modifier.CTRL) !== 0) {
        keys.push("Ctrl");
    }
    if ((mod & Modifier.ALT) !== 0) {
        keys.push("Alt");
    }
    if ((mod & Modifier.SHIFT) !== 0) {
        keys.push("Shift");
    }

    keys.push(key.toUpperCase());
    return keys.join("+");
};

const formatMac = (key: string, mod: number): string => {
    let mods = "";
    if ((mod & Modifier.ALT) !== 0) {
        mods += "\u2325"; // Option
    }
    if ((mod & Modifier.SHIFT) !== 0) {
        mods += "\u21E7"; // Shift
    }
    if ((mod & Modifier.CTRL) !== 0) {
        mods += "\u2318"; // Cmd
    }

    return mods + key.toUpperCase();
};
