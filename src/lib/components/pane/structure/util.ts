import { type Modifiers, parseModifiers, prettyJavaType, prettyMethodDesc } from "$lib/utils";
import { type ClassEntry, type Entry, EntryType, memberEntry } from "$lib/workspace";
import type { Node } from "@katana-project/asm";
import type { InnerClassesAttribute } from "@katana-project/asm/attr";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { AttributeType } from "@katana-project/asm/spec";

interface Method {
    name: string;
    type: string;
    signature: string;
    constructor: boolean;
    initializer: boolean;
    access: Modifiers;
    entry: Entry;
}

interface Field {
    name: string;
    type: string;
    signature: string;
    access: Modifiers;
}

interface InnerClass {
    name?: string;
    access: Modifiers;
    record: boolean;
    entry?: Entry;
}

export const methods = (entry: ClassEntry): Method[] => {
    const node = entry.node!;

    return node.methods.map((method) => {
        const constructor = method.name.string === "<init>";
        const initializer = method.name.string === "<clinit>";
        return {
            name: method.name.string,
            type: method.type.string,
            signature:
                (constructor || initializer ? "" : method.name.string) +
                prettyMethodDesc(method.type.string, !constructor && !initializer),
            constructor,
            initializer,
            access: parseModifiers(method.access),
            entry: memberEntry(entry, method),
        };
    });
};

export const fields = (node: Node): Field[] => {
    return node.fields.map((field) => ({
        name: field.name.string,
        type: field.type.string,
        signature: `${field.name.string}: ${prettyJavaType(field.type.string, true)}`,
        access: parseModifiers(field.access),
    }));
};

export const innerClasses = (node: Node, classes: Map<string, Entry>): InnerClass[] => {
    const attr = node.attrs.find((attr) => attr.type === AttributeType.INNER_CLASSES);
    if (!attr) {
        return [];
    }

    const thisClass = (node.pool[node.thisClass.name] as UTF8Entry).string;
    return (attr as InnerClassesAttribute).classes
        .map((klass) => {
            const poolEntry = klass.innerEntry;
            if (!poolEntry) {
                return null;
            }

            const outerEntry = klass.outerEntry;
            if (outerEntry) {
                const outerName = (node.pool[outerEntry.name] as UTF8Entry).string;
                if (outerName !== thisClass) {
                    // not an inner class of this class
                    return null;
                }
            }

            let entry = classes.get((node.pool[poolEntry.name] as UTF8Entry).string) as ClassEntry | undefined;
            if (entry?.type !== EntryType.CLASS) {
                entry = undefined;
            }

            let record = false;
            if (entry?.node?.superClass) {
                const superName = (entry!.node.pool[entry!.node.superClass.name] as UTF8Entry).string;
                record = superName === "java/lang/Record";
            }

            return {
                name: klass.innerNameEntry?.string,
                access: parseModifiers(klass.innerAccess),
                record,
                entry,
            };
        })
        .filter(Boolean) as InnerClass[];
};

interface AbstractionInfo {
    superClass?: string;
    implementations: string[];
}

export const abstractionInfo = (node: Node): AbstractionInfo => {
    return {
        superClass: node.superClass ? (node.pool[node.superClass.name] as UTF8Entry).string : undefined,
        implementations: node.interfaces.map((itf) => (node.pool[itf.name] as UTF8Entry).string),
    };
};
