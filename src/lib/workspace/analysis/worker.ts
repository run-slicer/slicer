import { type Node, read } from "@run-slicer/asm";
import { escapeLiteral, formatEntry } from "@run-slicer/asm/analysis/disasm";
import { ConstantType } from "@run-slicer/asm/spec";
import { expose } from "comlink";
import { type SearchData, SearchMode, type SearchResultData } from "./search";

export interface Worker {
    read(data: Uint8Array, flags: number): Promise<Node>;

    searchPoolEntry(data: SearchData): Promise<SearchResultData[]>;
    searchField(data: SearchData): Promise<SearchResultData[]>;
    searchMethod(data: SearchData): Promise<SearchResultData[]>;
}

const createComparator = (value: string, mode: SearchMode): ((v: string) => boolean) => {
    switch (mode) {
        case SearchMode.PARTIAL_MATCH:
            return (v) => v.includes(value);
        case SearchMode.EXACT_MATCH:
            return (v) => v === value;
        case SearchMode.REGEXP:
            const regex = new RegExp(value);
            return (v) => regex.test(v);
    }
};

expose({
    async read(buf: Uint8Array, flags: number): Promise<Node> {
        return read(buf, flags);
    },
    async searchPoolEntry({ node, value, mode }: SearchData): Promise<SearchResultData[]> {
        const comparator = createComparator(value, mode);

        return node.pool
            .filter((e) => e !== null)
            .map((e) => ({ value: `${ConstantType[e.type]} ${formatEntry(e, node.pool)}` }))
            .filter((e) => comparator(e.value));
    },
    async searchField({ node, value, mode }: SearchData): Promise<SearchResultData[]> {
        const comparator = createComparator(value, mode);

        return node.fields
            .map((m) => ({
                value: `${escapeLiteral(m.name.string)} ${escapeLiteral(m.type.string)}`,
                member: m,
            }))
            .filter((m) => comparator(m.value));
    },
    async searchMethod({ node, value, mode }: SearchData): Promise<SearchResultData[]> {
        const comparator = createComparator(value, mode);

        return node.methods
            .map((m) => ({
                value: `${escapeLiteral(m.name.string)}${escapeLiteral(m.type.string)}`,
                member: m,
            }))
            .filter((m) => comparator(m.value));
    },
} satisfies Worker);
