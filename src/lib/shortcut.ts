import { add, close, load, export_ } from "$lib/action";

// https://stackoverflow.com/questions/38241480/detect-macos-ios-windows-android-and-linux-os-with-js
const isMac = /Macintosh|Mac OS|MacIntel|MacPPC|Mac68K/gi.test(navigator.userAgent);

export const enum Modifier {
    Ctrl = 1 << 0,
    Shift = 1 << 1,
    Alt = 1 << 2,
}

const listen = (key: string, mod: number, callback: (e: KeyboardEvent) => void) => {
    const checks: ((e: KeyboardEvent) => boolean)[] = [(e) => e.key.toLowerCase() === key];
    if ((mod & Modifier.Ctrl) !== 0) {
        checks.push((e) => e.getModifierState(isMac ? "Meta" : "Control"));
    }
    if ((mod & Modifier.Alt) !== 0) {
        checks.push((e) => e.getModifierState("Alt"));
    }
    if ((mod & Modifier.Shift) !== 0) {
        checks.push((e) => e.getModifierState("Shift"));
    }

    window.addEventListener("keydown", (e) => {
        if (checks.every((check) => check(e))) {
            e.preventDefault();
            e.stopPropagation();

            callback(e);
        }
    });
};

export const register = () => {
    // order matters, shortcuts with (more) modifiers should be registered earlier

    listen("o", Modifier.Ctrl | Modifier.Shift, add);
    listen("o", Modifier.Ctrl, load);
    listen("w", Modifier.Ctrl | Modifier.Alt, close);
    listen("e", Modifier.Ctrl, () => export_());
};

export const format = (key: string, mod: number): string => {
    if (isMac) {
        return formatMac(key, mod);
    }

    let keys: string[] = [];
    if ((mod & Modifier.Ctrl) !== 0) {
        keys.push("Ctrl");
    }
    if ((mod & Modifier.Alt) !== 0) {
        keys.push("Alt");
    }
    if ((mod & Modifier.Shift) !== 0) {
        keys.push("Shift");
    }

    keys.push(key.toUpperCase());
    return keys.join("+");
};

const formatMac = (key: string, mod: number): string => {
    let mods = "";
    if ((mod & Modifier.Alt) !== 0) {
        mods += "\u2325"; // Option
    }
    if ((mod & Modifier.Shift) !== 0) {
        mods += "\u21E7"; // Shift
    }
    if ((mod & Modifier.Ctrl) !== 0) {
        mods += "\u2318"; // Cmd
    }

    return mods + key.toUpperCase();
};
