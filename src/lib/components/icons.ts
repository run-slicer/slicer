import type { ComponentType, SvelteComponent } from "svelte";

export type Icon = ComponentType<SvelteComponent<{ size?: number | string; class?: string }>>;
