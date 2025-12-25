import { type Member, type Node, read } from "@katana-project/asm";
import { escapeLiteral, formatEntry, formatInsn } from "@katana-project/asm/analysis/disasm";
import type { BootstrapMethodsAttribute, CodeAttribute } from "@katana-project/asm/attr";
import { readBootstrapMethods } from "@katana-project/asm/attr/bsm";
import { readCode } from "@katana-project/asm/attr/code";
import type { Entry, NameTypeEntry, Pool, UTF8Entry } from "@katana-project/asm/pool";
import { AttributeType, ConstantType } from "@katana-project/asm/spec";
import { expose } from "comlink";
import { QueryType, type SearchData, SearchMode, type SearchResultData } from "./search";

export interface AnalysisWorker {
    read(data: Uint8Array, flags: number): Promise<Node>;
    search(data: SearchData): Promise<SearchResultData[]>;
}

type Comparator = (v: string) => boolean;
const createComparator = (value: string, mode: SearchMode): Comparator => {
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

const readBsm = (node: Node): BootstrapMethodsAttribute | null => {
    const attr = node.attrs.find((a) => a.name?.string === AttributeType.BOOTSTRAP_METHODS);
    if (attr) {
        try {
            return readBootstrapMethods(attr, node.pool);
        } catch (e) {}
    }

    return null;
};

const searchPoolEntries = (
    node: Node,
    comparator: Comparator,
    filterFn: (entry: Entry) => boolean
): SearchResultData[] => {
    const bsmAttr = readBsm(node);
    return node.pool
        .filter((e) => e !== null && filterFn(e))
        .map((e) => ({ value: formatEntry(e!, node.pool, bsmAttr ?? undefined) }))
        .filter((e) => comparator(e.value));
};

const isMethodNameType = (entry: Entry, pool: Pool): boolean => {
    return (
        entry.type === ConstantType.NAME_AND_TYPE &&
        (pool[(entry as NameTypeEntry).type_] as UTF8Entry).string.charAt(0) === "("
    );
};

const searchMembers = (members: Member[], comparator: Comparator): SearchResultData[] => {
    return members
        .map((m) => ({
            value: `${escapeLiteral(m.name.string)} ${escapeLiteral(m.type.string)}`,
            member: m,
        }))
        .filter((m) => comparator(m.value));
};

expose({
    async read(buf: Uint8Array, flags: number): Promise<Node> {
        return read(buf, flags);
    },
    async search({ type, node, value, mode, ref }: SearchData): Promise<SearchResultData[]> {
        const comparator = createComparator(value, mode);

        switch (type) {
            case QueryType.PSEUDOCODE:
                const bsmAttr = readBsm(node);
                const code = [
                    ...node.methods.flatMap((member) =>
                        member.attrs
                            .filter((a) => a.name?.string === AttributeType.CODE)
                            .map((attr) => {
                                try {
                                    return attr.type === AttributeType.CODE
                                        ? (attr as CodeAttribute)
                                        : readCode(attr, node.pool);
                                } catch (e) {}
                                return null;
                            })
                            .filter((i) => i !== null)
                            .flatMap((code) =>
                                code.insns.map((i) => ({
                                    member,
                                    value: formatInsn(code, bsmAttr, i, node.pool, true),
                                }))
                            )
                    ),
                    ...node.pool
                        .filter((e) => e !== null)
                        .map((e) => ({
                            value: `${ConstantType[e.type]} ${formatEntry(e, node.pool, bsmAttr ?? undefined)}`,
                        })),
                ];

                return code.filter((e) => comparator(e.value));
            case QueryType.STRING:
                return searchPoolEntries(node, comparator, (e) => e.type === ConstantType.STRING);
            case QueryType.FIELD:
                return ref
                    ? searchPoolEntries(
                          node,
                          comparator,
                          (e) => e.type === ConstantType.NAME_AND_TYPE && !isMethodNameType(e, node.pool)
                      )
                    : searchMembers(node.fields, comparator);
            case QueryType.METHOD:
                return ref
                    ? searchPoolEntries(node, comparator, (e) => isMethodNameType(e, node.pool))
                    : searchMembers(node.methods, comparator);
        }
    },
} satisfies AnalysisWorker);
