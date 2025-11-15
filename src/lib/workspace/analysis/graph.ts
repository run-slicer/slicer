import { type ClassEntry, classes, EntryType } from "$lib/workspace";
import type { UTF8Entry } from "@katana-project/asm/pool";
import { derived } from "svelte/store";

export interface IGraphNode {
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

        const classNode = node((klassNode.pool[klassNode.thisClass.name] as UTF8Entry).string);
        classNode.entry = klass;

        if (klassNode.superClass) {
            classNode.superClass = {
                from: classNode,
                to: node((klassNode.pool[klassNode.superClass.name] as UTF8Entry).string),
                itf: false,
            };
        }
        for (const itf of klassNode.interfaces) {
            classNode.interfaces.push({
                from: classNode,
                to: node((klassNode.pool[itf.name] as UTF8Entry).string),
                itf: true,
            });
        }
    }

    return graph;
};

export const graph = derived(classes, ($classes) =>
    createGraph(Array.from($classes.values()).filter((e) => e.type === EntryType.CLASS) as ClassEntry[])
);
