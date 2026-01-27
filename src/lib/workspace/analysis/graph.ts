import { type ClassEntry, classes, EntryType } from "$lib/workspace";
import { derived } from "svelte/store";

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
    from: IGraphNode;
    to: IGraphNode;
    itf: boolean;
}

export interface InheritanceGraph {
    [className: string]: IGraphNode;
}

const createNode = (className: string): IGraphNode => ({
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
                    visit(node.superClass.to, level - 1, [...visited, node]);
                }

                // visit interfaces
                for (const itfEdge of node.interfaces) {
                    visit(itfEdge.to, level - 1, [...visited, node]);
                }
            }

            if (direction === WalkDirection.DOWN || direction === WalkDirection.BOTH) {
                // visit subclasses
                for (const subEdge of node.subClasses) {
                    visit(subEdge.to, level + 1, [...visited, node]);
                }

                // visit implementations
                for (const implEdge of node.implementations) {
                    visit(implEdge.to, level + 1, [...visited, node]);
                }
            }
        };

        visit(this);
        return results;
    },
});

const createGraph = (classes: ClassEntry[]): InheritanceGraph => {
    const graph: InheritanceGraph = {};
    const node = (className: string): IGraphNode => {
        if (!graph[className]) {
            graph[className] = createNode(className);
        }
        return graph[className];
    };

    for (const klass of classes) {
        const { node: klassNode } = klass;

        const classNode = node(klassNode.thisClass.nameEntry!.string);
        classNode.entry = klass;

        if (klassNode.superClass) {
            classNode.superClass = {
                from: classNode,
                to: node(klassNode.superClass.nameEntry!.string),
                itf: false,
            };
        }
        for (const itf of klassNode.interfaces) {
            const itfNode = node(itf.nameEntry!.string);
            itfNode.type = IGraphNodeType.INTERFACE;

            classNode.interfaces.push({
                from: classNode,
                to: itfNode,
                itf: true,
            });
        }
    }

    for (const classNode of Object.values(graph)) {
        if (classNode.superClass) {
            const superNode = classNode.superClass.to;
            if (!superNode.subClasses.some((e) => e.from === superNode && e.to === classNode)) {
                superNode.subClasses.push({
                    from: superNode,
                    to: classNode,
                    itf: false,
                });
            }
        }
        for (const itfEdge of classNode.interfaces) {
            const itfNode = itfEdge.to;
            if (!itfNode.implementations.some((e) => e.from === itfNode && e.to === classNode)) {
                itfNode.implementations.push({
                    from: itfNode,
                    to: classNode,
                    itf: true,
                });
            }
        }
    }

    return graph;
};

export const graph = derived(classes, ($classes) =>
    createGraph(Array.from($classes.values()).filter((e) => e.type === EntryType.CLASS) as ClassEntry[])
);
