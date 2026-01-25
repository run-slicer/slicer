import type { ClassEntry } from "$lib/workspace";
import type { IGraphNode, InheritanceGraph } from "$lib/workspace/analysis/graph";

const IMPLICIT_SUPER = new Set([
    "java/lang/Object",
    "java/lang/Enum",
    "java/lang/Record",
    "java/lang/annotation/Annotation",
]);

const buildNode = (
    graphNode: IGraphNode,
    graph: InheritanceGraph,
    parent?: ClassEntry,
    universe?: Set<IGraphNode>
): ImplementationTreeNode | null => {
    if (!graphNode.entry) return null;

    const entry = graphNode.entry;
    const children: ImplementationTreeNode[] = [];

    const nodesToScan = universe ?? new Set(
        graphNode.relations(graph, n => !IMPLICIT_SUPER.has(n.name))
    );

    for (const other of nodesToScan) {
        if (!(other.superClass?.to === graphNode || other.interfaces.some(itf => itf.to === graphNode))) continue;

        const child = buildNode(other, graph, entry, nodesToScan);
        if (child) children.push(child);
    }

    return {
        entry,
        parent,
        children,
    };
};

export const computeImplementationTree = (
    rootClassName: string,
    graph: InheritanceGraph
): ImplementationTreeNode | null => {
    const root = graph[rootClassName];
    if (!root || !root.entry) return null;

    return buildNode(root, graph);
};

export interface ImplementationTreeNode {
    entry: ClassEntry;
    parent?: ClassEntry;
    children: ImplementationTreeNode[];
}
