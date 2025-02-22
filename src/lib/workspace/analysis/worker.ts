import { read, type Member, type Node } from "@run-slicer/asm";
import { formatEntry } from "@run-slicer/asm/analysis/disasm";
import type { Entry as PoolEntry } from "@run-slicer/asm/pool";
import { expose } from "comlink";
import { QueryFlag, type SearchData } from "./search";

export interface Worker {
    read(data: Uint8Array, flags: number): Promise<Node>;

    searchPoolEntry(data: SearchData): Promise<PoolEntry[]>;
    searchMember(data: SearchData): Promise<Member[]>;
}

const createComparator = (value: string, flags: number): ((v: string) => boolean) => {
    if ((flags & QueryFlag.CASE_INSENSITIVE) !== 0) {
        value = value.toLowerCase();
    }

    return (v) => {
        if ((flags & QueryFlag.CASE_INSENSITIVE) !== 0) {
            v = v.toLowerCase();
        }

        return (flags & QueryFlag.EXACT_MATCH) !== 0 ? v === value : v.includes(value);
    };
};

expose({
    async read(buf: Uint8Array, flags: number): Promise<Node> {
        return read(buf, flags);
    },
    async searchPoolEntry(data: SearchData): Promise<PoolEntry[]> {
        const { node, value, flags } = data;
        const comparator = createComparator(value, flags);

        return node.pool.filter((e) => e && comparator(formatEntry(e, node.pool))) as PoolEntry[];
    },
    async searchMember(data: SearchData): Promise<Member[]> {
        const { node, value, flags } = data;
        const comparator = createComparator(value, flags);

        return [...node.fields, ...node.methods].filter((m) => comparator(`${m.name.string} ${m.type.string}`));
    },
} satisfies Worker);
