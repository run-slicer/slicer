import type { InheritanceGraph, IGraphNode } from "$lib/workspace/analysis/graph";
import type { ImplementationTreeNode, ClassEntry } from "$lib/workspace";

const IMPLICIT_SUPER = new Set([
    "java/lang/Object",
    "java/lang/Enum",
    "java/lang/Record",
    "java/lang/annotation/Annotation",
]);

const buildNode = (
    graphNode: IGraphNode,
    graph: InheritanceGraph,
    parent?: ClassEntry
): ImplementationTreeNode | null => {
    if (!graphNode.entry) return null;

    const entry = graphNode.entry;

    const children: ImplementationTreeNode[] = [];

    for (const other of Object.values(graph)) {
        // extends
        if (other.superClass?.to === graphNode) {
            if (!IMPLICIT_SUPER.has(other.name)) {
                const child = buildNode(other, graph, entry);
                if (child) children.push(child);
            }
        }

        // implements
        for (const itf of other.interfaces) {
            if (itf.to === graphNode) {
                const child = buildNode(other, graph, entry);
                if (child) children.push(child);
                break;
            }
        }
    }

    return {
        entry,
        parent,
        children,
    };
}

export const computeImplementationTree = (
    rootClassName: string,
    graph: InheritanceGraph
): ImplementationTreeNode | null => {
    const root = graph[rootClassName];
    if (!root || !root.entry) return null;

    return buildNode(root, graph);
}
