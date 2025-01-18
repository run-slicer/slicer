/* array ops */

import { derived, type Readable, writable, type Writable } from "svelte/store";

export const partition = <T>(arr: T[], func: (e: T) => boolean): [T[], T[]] => {
    const pass: T[] = [],
        fail: T[] = [];
    for (const elem of arr) {
        (func(elem) ? pass : fail).push(elem);
    }

    return [pass, fail];
};

export const groupBy = <K, V>(arr: V[], func: (e: V) => K): Map<K, V[]> => {
    const map = new Map<K, V[]>();
    for (const e of arr) {
        const key = func(e);

        const group = map.get(key);
        if (!group) {
            map.set(key, [e]);
        } else {
            group.push(e);
        }
    }

    return map;
};

export const chunk = <T>(arr: T[], size: number): T[][] => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }

    return chunks;
};

export const roundRobin = <T>(size: number, func: () => T): (() => T) => {
    const items = new Array<T>(size);
    for (let i = 0; i < size; i++) {
        items[i] = func();
    }

    let currItem = 0;
    return () => {
        const item = items[currItem++];
        if (currItem >= items.length) {
            currItem = 0; // wrap around
        }

        return item;
    };
};

/*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    License: Public domain (or MIT if needed). Attribution appreciated.
    A fast and simple 53-bit string hash function with decent collision resistance.
    Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
*/
export const cyrb53 = (str: string, seed: number = 0): number => {
    let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/* stores */

export const persisted = <T>(key: string, initialValue: T): Writable<T> => {
    const value = localStorage.getItem(key);

    const store = writable<T>(value ? JSON.parse(value) : initialValue);
    store.subscribe((v) => {
        localStorage.setItem(key, JSON.stringify(v));
    });
    return store;
};

export const debounced = <T>(store: Readable<T>, delay: number): Readable<T> => {
    let timeoutId: any;
    return derived(store, ($store, set) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => set($store), delay);
    });
};

/* file operations */

export const readFiles = (pattern: string, multiple: boolean): Promise<File[]> => {
    return new Promise<File[]>((resolve) => {
        const input = document.createElement("input");
        input.style.display = "none";
        input.type = "file";
        input.accept = pattern;
        input.multiple = multiple;

        input.addEventListener("cancel", () => input.remove());
        input.addEventListener("change", async () => {
            resolve(input.files ? [...input.files] : []);
            input.remove();
        });

        input.click();
    });
};

export const downloadBlob = (name: string, blob: Blob): Promise<void> => {
    return new Promise<void>((resolve) => {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.download = name;

        link.click();

        // pretty primitive solution, but should work
        setTimeout(() => {
            link.remove();
            URL.revokeObjectURL(url);

            resolve();
        }, 200);
    });
};

/* formatting */

// https://stackoverflow.com/a/14919494

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export const humanSize = (bytes: number, si: boolean = false, dp: number = 1): string => {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }

    const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

    return bytes.toFixed(dp) + " " + units[u];
};

const HEX_ROW_BYTES = 16;

export const formatHex = async (buffer: Uint8Array): Promise<string> => {
    let result = "";
    for (let row = 0; row < buffer.length; row += HEX_ROW_BYTES) {
        result += row.toString(16).padStart(8, "0") + "  "; // address

        // hexadecimal representation
        for (let col = 0; col < HEX_ROW_BYTES; col++) {
            if (row + col < buffer.length) {
                result += buffer[row + col].toString(16).padStart(2, "0") + " ";
            } else {
                result += "   "; // pad missing values
            }
        }
        result += " ";

        // ASCII representation
        for (let col = 0; col < HEX_ROW_BYTES; col++) {
            if (row + col < buffer.length) {
                const byte = buffer[row + col];
                result += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
            }
        }
        result += "\n";
    }

    return result;
};

const primTypes: Record<string, string> = {
    B: "byte",
    C: "char",
    D: "double",
    F: "float",
    I: "int",
    J: "long",
    S: "short",
    Z: "boolean",
    V: "void",
};

export const prettyJavaType = (desc: string, short: boolean = false): string => {
    if (!desc) {
        return desc;
    }

    switch (desc[0]) {
        case "[":
            return `${prettyJavaType(desc.substring(1), short)}[]`;
        case "L": {
            const type = desc.substring(1, desc.length - 1);
            if (short) {
                const index = type.lastIndexOf("/");
                return index !== -1 ? type.substring(index + 1) : type;
            }

            return type.replaceAll("/", ".");
        }
    }
    return primTypes[desc] || desc.replaceAll("/", ".");
};

export const prettyMethodDesc = (desc: string): string => {
    const descs = desc.substring(1, desc.lastIndexOf(")")); // ignore return type

    const args: string[] = [];
    for (let i = 0; i < descs.length; i++) {
        const char = descs.charAt(i);

        const start = i;
        switch (char) {
            case "L": {
                i = descs.indexOf(";", i);
                args.push(descs.substring(start, i + 1));
                break;
            }
            case "[": {
                while (descs.charAt(i) === "[") {
                    i++;
                }
                if (descs.charAt(i) === "L") {
                    i = descs.indexOf(";", i);
                }

                args.push(descs.substring(start, i + 1));
                break;
            }
            default: {
                args.push(char);
                break;
            }
        }
    }

    return `(${args.map((a) => prettyJavaType(a, true)).join(", ")})`;
};

export const prettyError = (e: any): string => {
    if (e.toString === Object.prototype.toString) {
        return JSON.stringify(e, null, 2);
    }

    const stack = (e as Error).stack;
    if (stack) {
        const lines = stack
            .trim()
            .split("\n")
            .map((l) => l.trim());

        if (lines[0] === "Error") {
            lines.shift();
        }
        return e.toString() + "\n" + lines.join("\n").replaceAll(/^/gm, "  ");
    }

    return e.toString();
};

/* strings */

export const truncate = (str: string, n: number, suffix: string = "..."): string => {
    return str.length > n ? str.substring(0, n - 1) + suffix : str;
};

export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.substring(1);
};

/* dates */

export const timestampFile = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}_${month}_${day}-${hours}_${minutes}_${seconds}`;
};
