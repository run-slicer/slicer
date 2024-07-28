import {
    type Invalidator,
    type Subscriber,
    type Unsubscriber,
    type Updater,
    type Writable,
    writable,
} from "svelte/store";

export const persisted = <T>(key: string, initialValue: T): Writable<T> => {
    const value = localStorage.getItem(key);

    const store = writable<T>(value ? JSON.parse(value) : initialValue);
    store.subscribe((v) => {
        localStorage.setItem(key, JSON.stringify(v));
    });
    return store;
};

export const writableDerived = <T, D>(store: Writable<T>, from: (e: T) => D, to: (e: D) => T): Writable<D> => {
    return {
        set(value: D): void {
            store.set(to(value));
        },
        update(updater: Updater<D>): void {
            store.update((e) => to(updater(from(e))));
        },
        subscribe(run: Subscriber<D>, invalidate?: Invalidator<D>): Unsubscriber {
            return store.subscribe(
                (e) => run(from(e)),
                invalidate !== undefined ? (e) => invalidate(e !== undefined ? from(e) : undefined) : undefined
            );
        },
    };
};
