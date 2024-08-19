import { type Writable, writable } from "svelte/store";

export const persisted = <T>(key: string, initialValue: T): Writable<T> => {
    const value = localStorage.getItem(key);

    const store = writable<T>(value ? JSON.parse(value) : initialValue);
    store.subscribe((v) => {
        localStorage.setItem(key, JSON.stringify(v));
    });
    return store;
};
