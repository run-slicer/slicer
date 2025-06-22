import { type ClassEntry, type Entry, EntryType, readDeferred } from "$lib/workspace";
import type { Node as ClassNode, Member } from "@run-slicer/asm";
import { formatEntry, formatInsn } from "@run-slicer/asm/analysis/disasm";
import { type Node as GraphNode, EdgeType, computeGraph } from "@run-slicer/asm/analysis/graph";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import type { Pool, UTF8Entry } from "@run-slicer/asm/pool";
import { AttributeType } from "@run-slicer/asm/spec";
import type { Edge, MarkerType, Node } from "@xyflow/svelte";
import ELK, { type ElkNode } from "elkjs/lib/elk-api";

export type ControlFlowNodeData = {
    node: GraphNode;
    lines: string[];
    width: number;
    height: number;
};

const monoFont = `400 12px / 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

const canvas = document.createElement("canvas");
const computeTextSize = (text: string): TextMetrics => {
    const context = canvas.getContext("2d")!;
    context.font = monoFont;

    return context.measureText(text);
};

const commonOptions = {
    "elk.algorithm": "layered",
    "elk.portAlignment.default": "CENTER",
    "elk.portConstraints": "FIXED_SIDE",
    "elk.edgeRouting": "ORTHOGONAL",
    // spacing
    "elk.spacing.nodeNode": "60",
    "elk.spacing.edgeEdge": "40",
    "elk.spacing.edgeNode": "40",
    "elk.layered.spacing.nodeNodeBetweenLayers": "60",
    "elk.layered.spacing.edgeEdgeBetweenLayers": "40",
    "elk.layered.spacing.edgeNodeBetweenLayers": "40",
};

const controlFlowLayoutOptions = {
    ...commonOptions,
    "elk.direction": "DOWN",
    "elk.layered.layering.strategy": "LONGEST_PATH_SOURCE",
    "elk.layered.considerModelOrder.strategy": "PREFER_NODES",
    "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
    "elk.layered.crossingMinimization.semiInteractive": "true",
};

const hierarchyLayoutOptions = {
    ...commonOptions,
    "elk.direction": "UP",
    "elk.layered.nodePlacement.strategy": "SIMPLE",
};

const elk = new ELK({ workerFactory: () => new Worker(new URL("elkjs/lib/elk-worker.js", import.meta.url)) });

export const computeControlFlowGraph = async (
    method: Member,
    pool: Pool,
    withExcHandlers: boolean
): Promise<[Node[], Edge[]]> => {
    const attr = method.attrs.find((a) => a.type === AttributeType.CODE);
    if (!attr) {
        return [[], []]; // no Code attribute
    }

    const code = attr as CodeAttribute;

    const { nodes, edges } = computeGraph(code);

    const excEdges = (withExcHandlers ? nodes : []).flatMap((node) => {
        return code.exceptionTable
            .filter((e) => node.offset >= e.startPC && node.insns[node.insns.length - 1].offset < e.endPC)
            .map((e) => ({
                source: node.offset,
                target: e.handlerPC,
                // https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.7.3 (exception_table[] -> catch_type)
                catchType: e.catchType === 0 ? "*" : formatEntry(pool[e.catchType]!, pool),
            }));
    });

    const data: ControlFlowNodeData[] = nodes.map((node) => {
        const lines = node.insns.map((i) => formatInsn(code, i, pool, false));
        const metrics = computeTextSize(lines.reduce((a, b) => (a.length > b.length ? a : b)));

        return {
            node,
            lines,
            width: metrics.width + 20 /* padding */ + 2 /* border */,
            height: 18 /* line height */ * lines.length + 20 /* padding */ + 2 /* border */,
        };
    });

    const graph: ElkNode = {
        id: "root",
        children: data.map((d) => ({
            id: `${d.node.offset}`,
            width: d.width,
            height: d.height,
        })),
        edges: [...edges, ...excEdges].map((e) => ({
            id: `${e.source}-${e.target}`,
            sources: [`${e.source}`],
            targets: [`${e.target}`],
            labels: [{ text: "placeholder" } /* ELK doesn't need to know the content */],
        })),
    };

    const layout = await elk.layout(graph, { layoutOptions: controlFlowLayoutOptions });
    return [
        data.map((d) => {
            const elkNode = layout.children?.find((n) => n.id === `${d.node.offset}`);

            return {
                id: `${d.node.offset}`,
                type: "cf-node",
                data: d,
                position: {
                    x: elkNode?.x ?? 0,
                    y: elkNode?.y ?? 0,
                },
                // highlight entrypoint node
                style: d.node.offset === 0 ? "border: 1px solid var(--primary);" : undefined,
            };
        }),
        [
            ...edges.map((edge) => {
                let label: string | undefined = undefined;
                switch (edge.type) {
                    case EdgeType.CONDITION_FALSE:
                        label = "false";
                        break;
                    case EdgeType.CONDITION_TRUE:
                        label = "true";
                        break;
                    case EdgeType.SWITCH_DEFAULT:
                        label = "default";
                        break;
                    case EdgeType.SWITCH_BRANCH:
                        label = edge.value!.toString();
                        break;
                }

                return {
                    id: `${edge.source}-${edge.target}`,
                    type: "auto-edge",
                    label,
                    source: `${edge.source}`,
                    target: `${edge.target}`,
                    animated: !edge.jump,
                    markerEnd: {
                        type: "arrowclosed" as MarkerType /* skip non-type import */,
                    },
                    data: layout.edges?.find((e) => e.id === `${edge.source}-${edge.target}`)! as unknown as Record<
                        string,
                        unknown
                    >,
                };
            }),
            ...excEdges.map((edge) => ({
                id: `${edge.source}-${edge.target}`,
                type: "auto-edge",
                style: "stroke: var(--destructive);",
                label: edge.catchType,
                source: `${edge.source}`,
                target: `${edge.target}`,
                markerEnd: {
                    type: "arrowclosed" as MarkerType /* skip non-type import */,
                },
                data: layout.edges?.find((e) => e.id === `${edge.source}-${edge.target}`)! as unknown as Record<
                    string,
                    unknown
                >,
            })),
        ],
    ];
};

export type HierarchyNodeData = {
    node: HierarchyNode;
    width: number;
    height: number;
};

interface HierarchyNode {
    name: string;
    node?: ClassNode;
}

interface HierarchyEdge {
    parent: string;
    child: string;
    itf: boolean;
}

export const computeHierarchyGraph = async (
    node: ClassNode,
    classes: Map<string, Entry>,
    withImplicitSuperTypes: boolean
): Promise<[Node[], Edge[]]> => {
    const currentName = (node.pool[node.thisClass.name] as UTF8Entry).string;

    const nodes: HierarchyNode[] = [];
    const edges: HierarchyEdge[] = [];

    const processed = new Set<string>();
    const process = async (name: string, node?: ClassNode) => {
        processed.add(name);
        if (name === "java/lang/Object" && !withImplicitSuperTypes) {
            return; // don't include Object parent
        }

        nodes.push({ name, node });

        if (!node) {
            return; // need the node for super type examination
        }

        const processSuper = async (name: string) => {
            let entry = classes.get(name);
            if (entry) {
                entry = await readDeferred(entry);
            }

            await process(name, entry?.type === EntryType.CLASS ? (entry as ClassEntry).node : undefined);
        };

        if (node.superClass) {
            const superName = (node.pool[node.superClass.name] as UTF8Entry).string;
            if (superName !== "java/lang/Object" || withImplicitSuperTypes) {
                edges.push({ parent: superName, child: name, itf: false });

                if (!processed.has(superName)) {
                    await processSuper(superName);
                }
            }
        }
        for (const itf of node.interfaces) {
            const itfName = (node.pool[itf.name] as UTF8Entry).string;
            edges.push({ parent: itfName, child: name, itf: true });

            if (!processed.has(itfName)) {
                await processSuper(itfName);
            }
        }
    };

    await process(currentName, node);

    const data: HierarchyNodeData[] = nodes.map((node) => {
        const metrics = computeTextSize(node.name);

        return {
            node,
            width: metrics.width + 20 /* padding */ + 2 /* border */,
            height: 18 /* line height */ + 20 /* padding */ + 2 /* border */,
        };
    });

    const graph: ElkNode = {
        id: "root",
        children: data.map((d) => ({
            id: d.node.name,
            width: d.width,
            height: d.height,
        })),
        edges: edges.map((e) => ({
            id: `${e.parent}-${e.child}`,
            targets: [`${e.parent}`],
            sources: [`${e.child}`],
        })),
    };

    const layout = await elk.layout(graph, { layoutOptions: hierarchyLayoutOptions });
    return [
        data.map((d) => {
            const elkNode = layout.children?.find((n) => n.id === d.node.name);

            return {
                id: d.node.name,
                type: "hier-node",
                data: d,
                position: {
                    x: elkNode?.x ?? 0,
                    y: elkNode?.y ?? 0,
                },
                // highlight current node
                style: d.node.name === currentName ? "border: 1px solid var(--primary);" : undefined,
            };
        }),
        edges.map((edge) => ({
            id: `${edge.parent}-${edge.child}`,
            type: "auto-edge",
            source: edge.child,
            target: edge.parent,
            animated: edge.itf,
            markerEnd: {
                type: "arrowclosed" as MarkerType /* skip non-type import */,
            },
            data: layout.edges?.find((e) => e.id === `${edge.parent}-${edge.child}`)! as unknown as Record<
                string,
                unknown
            >,
        })),
    ];
};
