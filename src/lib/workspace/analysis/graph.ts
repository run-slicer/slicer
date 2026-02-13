import { type ClassEntry, classes, EntryType, type MemberEntry } from "$lib/workspace";
import type { Member } from "@katana-project/asm";
import { derived } from "svelte/store";
import { workers } from "./";

export enum IGraphNodeType {
    CLASS = "class",
    INTERFACE = "interface",
}

export enum WalkDirection {
    UP = "up",
    DOWN = "down",
    BOTH = "both",
}

export interface IGraphNode {
    type: IGraphNodeType;
    name: string;
    superClass: IGraphEdge | null;
    interfaces: IGraphEdge[];
    entry?: ClassEntry;
    get edges(): IGraphEdge[];

    subClasses: IGraphEdge[];
    implementations: IGraphEdge[];
    walk<T>(direction: WalkDirection, func: (node: IGraphNode, level: number) => T | null): T[];
}

export interface IGraphEdge {
    sub: IGraphNode;
    super: IGraphNode;
    itf: boolean;
}

export interface InheritanceGraph {
    [className: string]: IGraphNode;
}

const createINode = (className: string): IGraphNode => ({
    type: IGraphNodeType.CLASS,
    name: className,
    superClass: null,
    interfaces: [],
    get edges() {
        return this.superClass ? [this.superClass, ...this.interfaces] : this.interfaces;
    },
    subClasses: [],
    implementations: [],
    walk<T>(direction: WalkDirection, func: (node: IGraphNode, level: number) => T | null): T[] {
        const results: T[] = [];

        // walk up and down the inheritance tree to find all related classes
        const visit = (node: IGraphNode, level: number = 0, visited: IGraphNode[] = []) => {
            if (visited.includes(node)) {
                return;
            }

            const result = func(node, level);
            if (result === null) {
                return; // stop walking
            }
            results.push(result);

            if (direction === WalkDirection.UP || direction === WalkDirection.BOTH) {
                // visit superclass
                if (node.superClass) {
                    visit(node.superClass.super, level - 1, [...visited, node]);
                }

                // visit interfaces
                for (const itfEdge of node.interfaces) {
                    visit(itfEdge.super, level - 1, [...visited, node]);
                }
            }

            if (direction === WalkDirection.DOWN || direction === WalkDirection.BOTH) {
                // visit subclasses
                for (const subEdge of node.subClasses) {
                    visit(subEdge.super, level + 1, [...visited, node]);
                }

                // visit implementations
                for (const implEdge of node.implementations) {
                    visit(implEdge.super, level + 1, [...visited, node]);
                }
            }
        };

        visit(this);
        return results;
    },
});

const createIGraph = (classes: ClassEntry[]): InheritanceGraph => {
    const graph: InheritanceGraph = {};
    const node = (className: string): IGraphNode => {
        if (!graph[className]) {
            graph[className] = createINode(className);
        }
        return graph[className];
    };

    for (const klass of classes) {
        const { node: klassNode } = klass;

        const classNode = node(klassNode.thisClass.nameEntry!.string);
        classNode.entry = klass;

        if (klassNode.superClass) {
            classNode.superClass = {
                sub: classNode,
                super: node(klassNode.superClass.nameEntry!.string),
                itf: false,
            };
        }
        for (const itf of klassNode.interfaces) {
            const itfNode = node(itf.nameEntry!.string);
            itfNode.type = IGraphNodeType.INTERFACE;

            classNode.interfaces.push({
                sub: classNode,
                super: itfNode,
                itf: true,
            });
        }
    }

    for (const classNode of Object.values(graph)) {
        if (classNode.superClass) {
            const superNode = classNode.superClass.super;
            if (!superNode.subClasses.some((e) => e.sub === superNode && e.super === classNode)) {
                superNode.subClasses.push({
                    sub: superNode,
                    super: classNode,
                    itf: false,
                });
            }
        }
        for (const itfEdge of classNode.interfaces) {
            const itfNode = itfEdge.super;
            if (!itfNode.implementations.some((e) => e.sub === itfNode && e.super === classNode)) {
                itfNode.implementations.push({
                    sub: itfNode,
                    super: classNode,
                    itf: true,
                });
            }
        }
    }

    return graph;
};

export const inheritanceGraph = derived(classes, ($classes) =>
    createIGraph(Array.from($classes.values()).filter((e) => e.type === EntryType.CLASS) as ClassEntry[])
);

export interface CGraphEdge {
    caller: CGraphNode;
    callee: CGraphNode;
}

export interface Callable {
    id: string;
    name: string;
    type: string;
    owner: string;
}

export interface CGraphNode extends Callable {
    callers: CGraphEdge[];
    callees: CGraphEdge[];
    get edges(): CGraphEdge[];

    member?: Member;
    ownerEntry?: ClassEntry;
}

export interface CallGraph {
    [id: string]: CGraphNode;
}

// TODO: explore making a global call graph for resolving callers
export const createCallGraph = async (root: MemberEntry, classes: ClassEntry[]): Promise<CallGraph> => {
    const graph: CallGraph = {};
    const node = (call: Callable): CGraphNode => {
        if (!graph[call.id]) {
            const ownerEntry = classes.find((c) => c.node.thisClass?.nameEntry?.string === call.owner);
            const member = ownerEntry?.node.methods.find(
                (m) => m.name?.string === call.name && m.type?.string === call.type
            );

            graph[call.id] = {
                ...call,
                callers: [],
                callees: [],
                member,
                ownerEntry,
                get edges() {
                    return this.callees;
                },
            };
        }
        return graph[call.id];
    };

    const visited = new Set<string>();
    const stack: CGraphNode[] = [
        node({
            id: `${root.node.thisClass.nameEntry!.string}#${root.member.name.string}${root.member.type.string}`,
            name: root.member.name.string,
            type: root.member.type.string,
            owner: root.node.thisClass.nameEntry!.string,
        }),
    ];

    while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current.id)) {
            continue;
        }
        visited.add(current.id);

        if (!current.member || !current.ownerEntry) {
            continue;
        }

        const callees = await workers.instance().task((w) => w.findCallees(current.member!, current.ownerEntry!.node));

        for (const callee of callees) {
            const calleeNode = node(callee);
            current.callees.push({ caller: current, callee: calleeNode });
            calleeNode.callers.push({ caller: current, callee: calleeNode });

            if (!visited.has(calleeNode.id)) {
                stack.push(calleeNode);
            }
        }
    }

    return graph;
};
