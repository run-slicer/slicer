import { type Node, read } from "@run-slicer/asm";
import { escapeLiteral, formatEntry } from "@run-slicer/asm/analysis/disasm";
import { ConstantType } from "@run-slicer/asm/spec";
import { expose } from "comlink";
import { QueryType, type SearchData, SearchMode, type SearchResultData } from "./search";

export interface Worker {
    read(data: Uint8Array, flags: number): Promise<Node>;
    search(data: SearchData): Promise<SearchResultData[]>;
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
    async search({ type, node, value, mode }: SearchData): Promise<SearchResultData[]> {
        const comparator = createComparator(value, mode);

        switch (type) {
            case QueryType.POOL_ENTRY:
                return node.pool
                    .filter((e) => e !== null)
                    .map((e) => ({ value: `${ConstantType[e.type]} ${formatEntry(e, node.pool)}` }))
                    .filter((e) => comparator(e.value));
            case QueryType.FIELD:
                return node.fields
                    .map((m) => ({
                        value: `${escapeLiteral(m.name.string)} ${escapeLiteral(m.type.string)}`,
                        member: m,
                    }))
                    .filter((m) => comparator(m.value));
            case QueryType.METHOD:
                return node.methods
                    .map((m) => ({
                        value: `${escapeLiteral(m.name.string)}${escapeLiteral(m.type.string)}`,
                        member: m,
                    }))
                    .filter((m) => comparator(m.value));
        }
    },
} satisfies Worker);
