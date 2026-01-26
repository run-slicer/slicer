import { type ClassEntry, classes, EntryType } from "$lib/workspace";
import { derived } from "svelte/store";

export const IMPLICIT_SUPER = new Set([
    "java/lang/Object",
    "java/lang/Enum",
    "java/lang/Record",
    "java/lang/annotation/Annotation",
]);

export enum IGraphNodeType {
    CLASS = "class",
    INTERFACE = "interface",
}

export interface IGraphNode {
    type: IGraphNodeType;
    name: string;
    superClass: IGraphEdge | null;
    interfaces: IGraphEdge[];
    entry?: ClassEntry;

    get edges(): IGraphEdge[];
    relations(graph: InheritanceGraph | null, filter: (node: IGraphNode) => boolean): IGraphNode[];
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
    relations(graph: InheritanceGraph | null, filter?: (node: IGraphNode) => boolean): IGraphNode[] {
        const relations = new Set<IGraphNode>();
        // walk up and down the inheritance tree to find all related classes
        const visit = (node: IGraphNode) => {
            if (relations.has(node) || (filter && !filter(node))) {
                return;
            }
            relations.add(node);

            // visit superclass
            if (node.superClass) {
                visit(node.superClass.to);
            }

            // visit interfaces
            for (const itfEdge of node.interfaces) {
                visit(itfEdge.to);
            }

            // visit subclasses
            if (graph) {
                for (const otherNode of Object.values(graph)) {
                    if (otherNode.superClass?.to === node) {
                        visit(otherNode);
                        continue;
                    }
                    for (const itfEdge of otherNode.interfaces) {
                        if (itfEdge.to === node) {
                            visit(otherNode);
                            break;
                        }
                    }
                }
            }
        };

        visit(this);
        return Array.from(relations);
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
            const toNode = node(itf.nameEntry!.string);
            toNode.type = IGraphNodeType.INTERFACE;

            classNode.interfaces.push({
                from: classNode,
                to: toNode,
                itf: true,
            });
        }
    }

    return graph;
};

export const graph = derived(classes, ($classes) =>
    createGraph(Array.from($classes.values()).filter((e) => e.type === EntryType.CLASS) as ClassEntry[])
);
