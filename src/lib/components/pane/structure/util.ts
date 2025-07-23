import { Class } from "$lib/components/icons";
import Abstract from "$lib/components/icons/java/abstract.svelte";
import Annotation from "$lib/components/icons/java/annotation.svelte";
import Enum from "$lib/components/icons/java/enum.svelte";
import Interface from "$lib/components/icons/java/interface.svelte";
import PrivateMember from "$lib/components/icons/java/private-member.svelte";
import ProtectedMember from "$lib/components/icons/java/protected-member.svelte";
import PublicMember from "$lib/components/icons/java/public-member.svelte";
import RecordIcon from "$lib/components/icons/java/record.svelte";
import { type ClassEntry, type Entry, EntryType, memberEntry } from "$lib/workspace";
import type { Node } from "@run-slicer/asm";
import type { InnerClassesAttribute } from "@run-slicer/asm/attr/inner_classes";
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { AttributeType, Modifier } from "@run-slicer/asm/spec";

type AccessModifier = "public" | "private" | "protected";

type Method = {
    name: string;
    type: string;
    constructor: boolean;
    modifier: AccessModifier;
    isFinal: boolean;
    isStatic: boolean;
    isAbstract: boolean;
    entry: Entry;
};

type Field = {
    name: string;
    type: string;
    isFinal: boolean;
    isStatic: boolean;
    modifier: AccessModifier;
};

type InnerClass = {
    name: string;
    modifier: AccessModifier;
    isFinal: boolean;
    isStatic: boolean;
    isAbstract: boolean;
    isEnum: boolean;
    isInterface: boolean;
    isAnnotation: boolean;
    isRecord: boolean;
    entry: Entry;
};

export const parseModifier: (access: number) => AccessModifier = (access) => {
    if ((access & Modifier.PUBLIC) !== 0) {
        return "public";
    } else if ((access & Modifier.PROTECTED) !== 0) {
        return "protected";
    } else return "private";
};

export const getMethods: (
    entry: Entry | undefined,
    node: Node | undefined,
    searchQuery: string | undefined
) => Method[] = (entry, node, searchQuery) => {
    if (!entry || entry.type !== EntryType.CLASS || !node) return [];

    const output = node.methods.map(
        (method) =>
            ({
                name: method.name.string,
                type: method.type.string,
                constructor: method.name.string.includes("<init>") || method.name.string.includes("<clinit>"),
                modifier: parseModifier(method.access),
                isFinal: (method.access & Modifier.FINAL) !== 0,
                isStatic: (method.access & Modifier.STATIC) !== 0,
                isAbstract: (method.access & Modifier.ABSTRACT) !== 0,
                entry: memberEntry(entry as ClassEntry, method),
            }) as Method
    );

    if (!searchQuery) return output;
    return output.filter(
        (member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
};

export const getFields: (node: Node | undefined, searchQuery: string | undefined) => Field[] = (node, searchQuery) => {
    if (!node) return [];

    const output = node.fields.map(
        (field) =>
            ({
                name: field.name.string,
                type: field.type.string,
                isFinal: (field.access & Modifier.FINAL) !== 0,
                isStatic: (field.access & Modifier.STATIC) !== 0,
                modifier: parseModifier(field.access),
            }) as Field
    );

    if (!searchQuery) return output;
    return output.filter(
        (member) =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
};

export const getInnerClasses: (
    node: Node | undefined,
    classes: Map<string, Entry>,
    searchQuery: string | undefined
) => InnerClass[] = (node, classes, searchQuery) => {
    if (!node || !classes) return [];

    const attribute = node.attrs.find((attr) => attr.type === AttributeType.INNER_CLASSES);

    if (!attribute) return [];

    const output = (attribute as InnerClassesAttribute).classes
        .filter((clazz) => clazz.innerNameEntry && clazz.innerEntry)
        .map((clazz) => {
            const poolEntry = clazz.innerEntry!!;
            const fullName = (node.pool[poolEntry.name] as UTF8Entry).string;
            const innerClassEntry = classes.get(fullName) as ClassEntry;

            if (!innerClassEntry) return undefined;

            const innerClassNode = innerClassEntry.node;

            let isRecord = false;

            if (innerClassNode.superClass) {
                const superName = (innerClassNode.pool[innerClassNode.superClass.name] as UTF8Entry).string;

                if (superName === "java/lang/Record") {
                    isRecord = true;
                }
            }

            return {
                name: clazz.innerNameEntry!!.string,
                modifier: parseModifier(clazz.innerAccess),
                isFinal: (clazz.innerAccess & Modifier.FINAL) !== 0,
                isStatic: (clazz.innerAccess & Modifier.STATIC) !== 0,
                isAbstract: (clazz.innerAccess & Modifier.ABSTRACT) !== 0,
                isEnum: (clazz.innerAccess & Modifier.ENUM) !== 0,
                isInterface: (clazz.innerAccess & Modifier.INTERFACE) !== 0,
                isAnnotation: (clazz.innerAccess & Modifier.ANNOTATION) !== 0,
                isRecord,
                entry: innerClassEntry,
            } as InnerClass;
        })
        .filter((it) => it !== undefined);

    if (!searchQuery) return output;
    return output.filter((member) => member.name.toLowerCase().includes(searchQuery.toLowerCase()));
};

export const getAbstractionInfo: (
    node: Node | undefined
) => { superClass: string; implementations: string[] } | undefined = (node) => {
    if (!node) return undefined;

    let superClass: string | undefined = undefined;
    const implementations: string[] = [];

    if (node.superClass) {
        superClass = (node.pool[node.superClass.name] as UTF8Entry).string;
    }

    node.interfaces.forEach((it) => {
        implementations.push((node.pool[it.name] as UTF8Entry).string);
    });

    return {
        superClass: superClass ?? "Unknown",
        implementations,
    };
};

export function getModifierIcon(modifier: AccessModifier) {
    switch (modifier) {
        case "public":
            return PublicMember;
        case "private":
            return PrivateMember;
        case "protected":
            return ProtectedMember;
        default:
            return null;
    }
}

export function getInnerClassIcon(innerClass: InnerClass) {
    if (innerClass.isAbstract) {
        return Abstract;
    } else if (innerClass.isEnum) {
        return Enum;
    } else if (innerClass.isInterface) {
        return Interface;
    } else if (innerClass.isAnnotation) {
        return Annotation;
    } else if (innerClass.isRecord) {
        return RecordIcon;
    } else {
        return Class;
    }
}
