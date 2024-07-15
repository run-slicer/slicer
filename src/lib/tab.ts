import type { Entry } from "$lib/workspace";
import { writable } from "svelte/store";
import type { Icon } from "$lib/components/icons";

export interface Tab {
    id: string;
    name: string;
    icon?: Icon;
    entry?: Entry;
    active: (tab: Tab) => boolean;
    open?: (tab: Tab) => void;
    close?: (tab: Tab) => void;
}

export const tabs = writable<Map<string, Tab>>(new Map());

export const update = (tab: Tab) => {
    tabs.update(($tabs) => {
        $tabs.set(tab.id, tab);
        return $tabs;
    })
};

export const remove = (id: string) => {
    tabs.update(($tabs) => {
        $tabs.delete(id);
        return $tabs;
    })
};

export const clear = () => {
    tabs.update(($tabs) => {
        for (const [id, tab] of $tabs.entries()) {
            if (tab.close) {
                $tabs.delete(id);
            }
        }
        return $tabs;
    })
};
