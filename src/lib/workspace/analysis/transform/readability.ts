import { AtSign, BugOff, Type, Variable, ZapOff } from "@lucide/svelte";
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
    {
        id: "remove-lvt",
        name: "Strip local variables",
        group: "Readability",
        icon: Variable,
        async run(entry, _data) {
            for (const method of entry.node.methods) {
                const code = method.attrs.findIndex((a) => a.type === AttributeType.CODE);
                if (code !== -1) {
                    const attr = method.attrs[code] as CodeAttribute;
                    attr.attrs = attr.attrs.filter((a) => !a.name?.string?.startsWith("LocalVariable"));
                }

                // method parameters also count as local vars
                method.attrs = method.attrs.filter((a) => a.name?.string !== AttributeType.METHOD_PARAMETERS);
            }

            return write(entry.node);
        },
    },
    {
        id: "remove-signatures",
        name: "Strip generic signatures",
        group: "Readability",
        icon: Type,
        async run(entry, _data) {
            entry.node = checkNode(entry.node, (attr) => attr.name?.string !== AttributeType.SIGNATURE);

            return write(entry.node);
        },
    },
    {
        id: "remove-debug",
        name: "Strip debug information",
        group: "Readability",
        icon: BugOff,
        async run(entry, _data) {
            entry.node = checkNode(entry.node, (attr) => {
                const name = attr.name?.string;
                return (
                    name !== AttributeType.DEPRECATED &&
                    name !== AttributeType.SOURCE_FILE &&
                    name !== AttributeType.SOURCE_DEBUG_EXTENSION &&
                    name !== AttributeType.LINE_NUMBER_TABLE
                );
            });

            return write(entry.node);
        },
    },
] satisfies Transformer[];
