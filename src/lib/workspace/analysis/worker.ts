import type { Callable } from "$lib/workspace/analysis/graph";
import { type Member, type Node, read } from "@katana-project/asm";
import { escapeLiteral, formatEntry, formatInsn } from "@katana-project/asm/analysis/disasm";
import type { BootstrapMethodsAttribute, CodeAttribute } from "@katana-project/asm/attr";
import { readBootstrapMethods } from "@katana-project/asm/attr/bsm";
import { readCode } from "@katana-project/asm/attr/code";
import type { InvokeInstruction } from "@katana-project/asm/insn";
import type { Entry, NameTypeEntry, RefEntry } from "@katana-project/asm/pool";
import { AttributeType, ConstantType, Opcode } from "@katana-project/asm/spec";
import { expose } from "comlink";
import { QueryType, type SearchData, SearchMode, type SearchResultData } from "./search";

export interface AnalysisWorker {
    read(data: Uint8Array, flags: number): Promise<Node>;
    search(data: SearchData): Promise<SearchResultData[]>;

    findCallees(member: Member, owner: Node): Promise<Callable[]>;
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

const isMethodNameType = (entry: Entry): boolean => {
    return entry.type === ConstantType.NAME_AND_TYPE && (entry as NameTypeEntry).typeEntry!.string.charAt(0) === "(";
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
                          (e) => e.type === ConstantType.NAME_AND_TYPE && !isMethodNameType(e)
                      )
                    : searchMembers(node.fields, comparator);
            case QueryType.METHOD:
                return ref
                    ? searchPoolEntries(node, comparator, (e) => isMethodNameType(e))
                    : searchMembers(node.methods, comparator);
        }
    },
    async findCallees(member: Member, owner: Node): Promise<Callable[]> {
        const callees: Callable[] = [];

        const code = member.attrs.find((a) => a.type === AttributeType.CODE) as CodeAttribute;
        if (!code) {
            return callees;
        }

        const visited = new Set<string>();
        for (const insn of code.insns) {
            switch (insn.opcode) {
                case Opcode.INVOKEVIRTUAL:
                case Opcode.INVOKESPECIAL:
                case Opcode.INVOKESTATIC:
                case Opcode.INVOKEINTERFACE: {
                    const ref = owner.pool[(insn as InvokeInstruction).ref] as RefEntry;
                    const calleeClass = ref.refEntry!;
                    const callee = ref.nameTypeEntry!;

                    const id = `${calleeClass.nameEntry!.string}#${callee.nameEntry!.string}${callee.typeEntry!.string}`;
                    if (!visited.has(id)) {
                        visited.add(id);
                        callees.push({
                            id,
                            name: callee.nameEntry!.string,
                            type: callee.typeEntry!.string,
                            owner: calleeClass.nameEntry!.string,
                        });
                    }
                    break;
                }
            }
        }

        return callees;
    },
} satisfies AnalysisWorker);
