import type { ClassEntry } from "$lib/workspace";
import type { Member, Node } from "@run-slicer/asm";

export enum QueryType {
    POOL_ENTRY = "pool_entry",
    MEMBER = "member",
}

export enum SearchMode {
    PARTIAL_MATCH = "partial_match",
    EXACT_MATCH = "exact_match",
    REGEXP = "regexp",
}

export interface SearchQuery {
    type: QueryType;
    value: string;
    mode: SearchMode;
}

export interface SearchResult {
    value: string;
    entry: ClassEntry;
    member?: Member;
}

// for marshalling over the worker barrier

export interface SearchData {
    node: Node;
    value: string;
    mode: SearchMode;
}

export interface SearchResultData {
    value: string;
    member?: Member;
}
