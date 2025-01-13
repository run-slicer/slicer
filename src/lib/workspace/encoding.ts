import { workspaceArchiveEncoding, workspaceEncoding } from "$lib/state";
import { derived } from "svelte/store";

export interface Encoding {
    id: string;
    label?: string;
}

const encodings0: Encoding[] = [
    { id: "utf-8" },
    { id: "utf-16" },
    { id: "iso-8859-1" },
    { id: "shift-jis", label: "Shift-JIS" },
];
export const encodings: Record<string, Encoding> = Object.fromEntries(encodings0.map((e) => [e.id, e]));

export const current = derived(
    workspaceEncoding,
    ($workspaceEncoding) => encodings[$workspaceEncoding] || { id: $workspaceEncoding }
);

export const decoder = derived(workspaceEncoding, ($workspaceEncoding) => new TextDecoder($workspaceEncoding));
export const archiveDecoder = derived(
    workspaceArchiveEncoding,
    ($workspaceArchiveEncoding) => new TextDecoder($workspaceArchiveEncoding)
);
