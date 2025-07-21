import type { ClassEntry } from "$lib/workspace";
import type { Member, Node } from "@run-slicer/asm";

export enum QueryType {
    PSEUDOCODE = "pseudocode",
    STRING = "string",
    FIELD = "field",
    METHOD = "method",
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
    ref: boolean;
}

export interface SearchResult {
    value: string;
    entry: ClassEntry;
    member?: Member;
}

// for marshalling over the worker barrier

export interface SearchData extends SearchQuery {
    node: Node;
}

export interface SearchResultData {
    value: string;
    member?: Member;
}
