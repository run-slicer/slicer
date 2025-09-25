import { type Member, write } from "@katana-project/asm";
import type { CodeAttribute } from "@katana-project/asm/attr";
import type { LoadStoreInstruction } from "@katana-project/asm/insn";
import { AttributeType, Modifier, Opcode } from "@katana-project/asm/spec";
import { Binary, Paintbrush, ShieldCheck, Variable, Zap } from "@lucide/svelte";
import type { Transformer } from "./";

const LOAD_OPCODES = new Set(Object.keys(Opcode).filter((o) => o.match(/^[ADFIL]LOAD(?:_[0-3])?$/)));
const STORE_OPCODES = new Set(Object.keys(Opcode).filter((o) => o.match(/^[ADFIL]STORE(?:_[0-3])?$/)));
const WSTORE_OPCODES = new Set(Object.keys(Opcode).filter((o) => o.match(/^[DL]STORE(?:_[0-3])?$/)));

// adapted from https://github.com/GraxCode/threadtear/blob/master/core/src/main/java/me/nov/threadtear/execution/generic/ObfuscatedAccess.java
const checkAccess = (member: Member, field: boolean) => {
    if (field) {
        if ((member.access & Modifier.FINAL) > 0 || member.name.string.match(/^(val\$|this\$).*$/)) {
            return;
        }
    } else {
        // method
        if ((member.access & Modifier.STATIC) > 0 || member.name.string.match(/^(access\$|lambda\$).*$/)) {
            return;
        }
    }

    member.access &= ~Modifier.SYNTHETIC;
    member.access &= ~Modifier.BRIDGE;
};

export default [
    {
        id: "norm-verify",
        name: "Verify attributes",
        group: "Normalization",
        icon: ShieldCheck,
        async run(entry, _data) {
            const { verify } = await import("@katana-project/asm/analysis/verify");
            verify(entry.node);

            return write(entry.node);
        },
    },
    {
        id: "norm-modifiers",
        name: "Remove unnecessary modifiers",
        group: "Normalization",
        icon: Binary,
        async run(entry, _data) {
            for (const field of entry.node.fields) {
                checkAccess(field, true);
            }
            for (const method of entry.node.methods) {
                checkAccess(method, false);
            }

            return write(entry.node);
        },
    },
    // adapted from https://github.com/GraxCode/threadtear/blob/master/core/src/main/java/me/nov/threadtear/execution/generic/TryCatchObfuscationRemover.java
    {
        id: "norm-try-catch",
        name: "Remove unnecessary try-catches",
        group: "Normalization",
        icon: Zap,
        async run(entry, _data) {
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    const attr = method.attrs[code] as CodeAttribute;
                    const valid = attr.exceptionTable.filter((e) => {
                        if (e.startPC >= e.endPC) {
                            return false;
                        }

                        const insnIndex = attr.insns.findIndex((i) => i.offset === e.handlerPC);
                        if (insnIndex === -1) {
                            return false;
                        }

                        const realInsn = attr.insns.slice(insnIndex).find((i) => i.opcode !== Opcode.NOP);
                        return realInsn !== undefined && realInsn.opcode !== Opcode.ATHROW;
                    });

                    attr.dirty = attr.exceptionTable.length > valid.length;
                    attr.exceptionTable = valid;
                }
            }

            return write(entry.node);
        },
    },
    // adapted from https://github.com/GraxCode/threadtear/blob/master/core/src/main/java/me/nov/threadtear/execution/cleanup/remove/RemoveUnusedVariables.java
    {
        id: "norm-lvt",
        name: "Remove unused local variables",
        group: "Normalization",
        icon: Variable,
        async run(entry, _data) {
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    const attr = method.attrs[code] as CodeAttribute;

                    const loadVars = new Set(
                        attr.insns
                            .filter((i) => LOAD_OPCODES.has(Opcode[i.opcode]))
                            .map((i) => (i as LoadStoreInstruction).index ?? parseInt(Opcode[i.opcode].slice(-1), 10))
                    );
                    if ((method.access & Modifier.STATIC) === 0) {
                        loadVars.add(0); // this
                    }

                    attr.insns = attr.insns.flatMap((insn) => {
                        if (!STORE_OPCODES.has(Opcode[insn.opcode])) return [insn];

                        const index =
                            (insn as LoadStoreInstruction).index ?? parseInt(Opcode[insn.opcode].slice(-1), 10);
                        if (loadVars.has(index)) return [insn];

                        const insns = [
                            {
                                opcode: WSTORE_OPCODES.has(Opcode[insn.opcode]) ? Opcode.POP2 : Opcode.POP,
                                operands: new Uint8Array(0),
                                offset: insn.offset,
                                length: 1,
                                dirty: false,
                            },
                        ];
                        // no-op the rest of the instruction's length to keep offsets intact
                        for (let j = 1; j < insn.length; j++) {
                            insns.push({
                                opcode: Opcode.NOP,
                                operands: new Uint8Array(0),
                                offset: insn.offset + j,
                                length: 1,
                                dirty: false,
                            });
                        }

                        attr.dirty = true;
                        return insns;
                    });
                }
            }

            return write(entry.node);
        },
    },
    {
        id: "norm-unreachable",
        name: "No-op unreachable code",
        group: "Normalization",
        icon: Paintbrush,
        async run(entry, _data) {
            const { removeUnreachable } = await import("@katana-project/asm/analysis/reach");
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    method.attrs[code] = removeUnreachable(method.attrs[code] as CodeAttribute);
                }
            }

            return write(entry.node);
        },
    },
] satisfies Transformer[];
