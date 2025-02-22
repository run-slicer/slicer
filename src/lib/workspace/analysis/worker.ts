import { type Node, read } from "@run-slicer/asm";
import { formatEntry } from "@run-slicer/asm/analysis/disasm";
import { ConstantType } from "@run-slicer/asm/spec";
import { expose } from "comlink";
import { type SearchData, SearchMode, type SearchResultData } from "./search";

export interface Worker {
    read(data: Uint8Array, flags: number): Promise<Node>;

    searchPoolEntry(data: SearchData): Promise<SearchResultData[]>;
    searchMember(data: SearchData): Promise<SearchResultData[]>;
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
    async searchMember({ node, value, mode }: SearchData): Promise<SearchResultData[]> {
        const comparator = createComparator(value, mode);

        return [...node.fields, ...node.methods]
            .map((m) => ({
                value: `${m.type.string[0] === "(" ? "method" : "field"} ${m.name.string} ${m.type.string}`,
                member: m,
            }))
            .filter((m) => comparator(m.value));
    },
} satisfies Worker);
