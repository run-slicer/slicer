/* array ops */

import { writable, type Writable } from "svelte/store";

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

export const prettyJavaType = (desc: string): string => {
    if (!desc) {
        return desc;
    }

    switch (desc[0]) {
        case "[":
            return `${prettyJavaType(desc.substring(1))}[]`;
        case "L":
            return desc.substring(1, desc.length - 1).replaceAll("/", ".");
    }
    return primTypes[desc] || desc.replaceAll("/", ".");
};

/* strings */

export const truncate = (str: string, n: number, suffix: string = "..."): string => {
    return str.length > n ? str.substring(0, n - 1) + suffix : str;
};

export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.substring(1);
};
