import type { Entry } from "$lib/workspace";
import type { Node } from "@run-slicer/asm";

export enum QueryType {
    POOL_ENTRY = "pool_entry",
    MEMBER = "member",
}

export const enum QueryFlag {
    CASE_INSENSITIVE = 1 << 0,
    EXACT_MATCH = 1 << 1,
}

export interface SearchQuery {
    type: QueryType;
    value: string;
    flags: number;
}

export interface SearchResult {
    value: string;
    entry: Entry;
}

export interface SearchData {
    node: Node;
    value: string;
    flags: number;
}
