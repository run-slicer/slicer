import { Binary, Paintbrush, ShieldCheck } from "@lucide/svelte";
import { type Member, write } from "@run-slicer/asm";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import { AttributeType, Modifier } from "@run-slicer/asm/spec";
import type { Transformer } from "./";

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

    member.access &= ~Modifier.SYNTHETIC & ~Modifier.BRIDGE;
};

export default [
    {
        id: "verify",
        name: "Verify attributes",
        group: "Normalization",
        icon: ShieldCheck,
        async run(entry, _data) {
            const { verify } = await import("@run-slicer/asm/analysis/verify");
            entry.node = verify(entry.node);

            return write(entry.node);
        },
    },
    {
        id: "nop-unreachable",
        name: "No-op unreachable code",
        group: "Normalization",
        icon: Paintbrush,
        async run(entry, _data) {
            const { removeUnreachable } = await import("@run-slicer/asm/analysis/reach");
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    method.attrs[code] = removeUnreachable(method.attrs[code] as CodeAttribute);
                }
            }

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
] satisfies Transformer[];
