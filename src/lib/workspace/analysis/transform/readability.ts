import { AtSign, Paintbrush, ZapOff } from "@lucide/svelte";
import { type DirtyMarkable, type Node, write } from "@run-slicer/asm";
import type { Attributable, Attribute, CodeAttribute } from "@run-slicer/asm/attr";
import { AttributeType } from "@run-slicer/asm/spec";
import type { Transformer } from "./";

// walking logic adapted from @run-slicer/asm/analysis/verify

type CheckFunc = (attr: Attribute) => boolean;

const check = (attrib: Attributable, func: CheckFunc): boolean => {
    let dirty = false;

    const valid = attrib.attrs.filter(func);
    if (attrib.attrs.length > valid.length) {
        dirty = true; // one or more attributes were removed, dirty
    }

    attrib.attrs = valid;

    // check nested attributes
    for (const attr of attrib.attrs) {
        if ("attrs" in attr && check(attr as Attributable, func)) {
            dirty = true; // a nested attribute is dirty, propagate
        }
    }

    if (dirty && "dirty" in attrib) {
        // mark ourselves as dirty
        (attrib as DirtyMarkable).dirty = true;
    }
    return dirty;
};

const checkNode = (node: Node, func: CheckFunc): Node => {
    check(node, func);
    for (const field of node.fields) {
        check(field, func);
    }
    for (const method of node.methods) {
        check(method, func);
    }

    return node;
};

export default [
    {
        id: "remove-unreachable",
        name: "No-op unreachable code",
        group: "Readability",
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
        id: "remove-annotations",
        name: "Strip annotations",
        group: "Readability",
        icon: AtSign,
        async run(entry, _data) {
            entry.node = checkNode(entry.node, (attr) => !attr.name?.string?.endsWith("Annotations"));

            return write(entry.node);
        },
    },
    {
        id: "remove-try-catch",
        name: "Strip try-catches",
        group: "Readability",
        icon: ZapOff,
        async run(entry, _data) {
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    const attr = method.attrs[code] as CodeAttribute;
                    if (attr.exceptionTable.length > 0) {
                        attr.exceptionTable = [];
                        attr.dirty = true;
                    }
                }
            }

            return write(entry.node);
        },
    },
] satisfies Transformer[];
