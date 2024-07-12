import { writable } from "svelte/store";

export interface Config {
    view: "text" | "hex";
}

export const current = writable<Config>({ view: "text" });
