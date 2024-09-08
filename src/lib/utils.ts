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
