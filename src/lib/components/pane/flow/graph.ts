import { prettyJavaType, prettyMethodDesc } from "$lib/utils";
import { type ClassEntry, type Entry, EntryType, readDeferred } from "$lib/workspace";
import type { Node as ClassNode, Member } from "@run-slicer/asm";
import { escapeLiteral, formatEntry, formatInsn } from "@run-slicer/asm/analysis/disasm";
import { computeGraph, EdgeType, type Node as GraphNode } from "@run-slicer/asm/analysis/graph";
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

const monoFF = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

const canvas = document.createElement("canvas");
const computeTextSize = (text: string, font: string): TextMetrics => {
    if (text.length === 0) {
        return { width: 0 } as TextMetrics;
    }

    const context = canvas.getContext("2d")!;
    context.font = font;

    return context.measureText(text);
};

const commonOptions = {
    "elk.algorithm": "layered",
    "elk.portAlignment.default": "CENTER",
    "elk.portConstraints": "FIXED_SIDE",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.layered.crossingMinimization.semiInteractive": "true",
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
};

const hierarchyLayoutOptions = {
    ...commonOptions,
    "elk.direction": "UP",
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
        const metrics = computeTextSize(
            lines.reduce((a, b) => (a.length > b.length ? a : b)),
            `400 12px / 18px ${monoFF}`
        );

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

interface MemberData {
    type: string;
    descriptor: string;
}

interface HierarchyNode {
    name: string;
    node?: ClassNode;
    fields: MemberData[];
    methods: MemberData[];
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

    // First, build a reverse lookup map for descendants
    const descendants = new Map<string, Set<string>>();
    for (const [className, entry] of classes) {
        if (entry.type === EntryType.CLASS) {
            const classNode = (entry as ClassEntry).node;

            // Add superclass relationship
            if (classNode.superClass) {
                const superName = (classNode.pool[classNode.superClass.name] as UTF8Entry).string;
                if (!descendants.has(superName)) {
                    descendants.set(superName, new Set());
                }
                descendants.get(superName)!.add(className);
            }

            // Add interface relationships
            for (const itf of classNode.interfaces) {
                const itfName = (classNode.pool[itf.name] as UTF8Entry).string;
                if (!descendants.has(itfName)) {
                    descendants.set(itfName, new Set());
                }
                descendants.get(itfName)!.add(className);
            }
        }
    }

    const process = async (name: string, node?: ClassNode) => {
        processed.add(name);
        if (name === "java/lang/Object" && !withImplicitSuperTypes) {
            return; // don't include Object parent
        }

        nodes.push({
            name,
            node,
            fields:
                node?.fields?.map((f) => ({
                    type: prettyJavaType(f.type.string, true),
                    descriptor: escapeLiteral(f.name.string),
                })) || [],
            methods:
                node?.methods?.map((m) => ({
                    type: prettyJavaType(m.type.string.substring(m.type.string.lastIndexOf(")") + 1), true),
                    descriptor: escapeLiteral(m.name.string) + prettyMethodDesc(m.type.string),
                })) || [],
        });

        if (!node) {
            return; // need the node for super type examination
        }

        const processRelated = async (name: string, analyze: boolean = true) => {
            let entry = classes.get(name);
            if (entry && analyze) {
                entry = await readDeferred(entry);
            }

            await process(name, entry?.type === EntryType.CLASS ? (entry as ClassEntry).node : undefined);
        };

        // Process superclass (walking up)
        if (node.superClass) {
            const superName = (node.pool[node.superClass.name] as UTF8Entry).string;
            if (superName !== "java/lang/Object" || withImplicitSuperTypes) {
                edges.push({ parent: superName, child: name, itf: false });

                if (!processed.has(superName)) {
                    await processRelated(superName);
                }
            }
        }

        // Process interfaces (walking up)
        for (const itf of node.interfaces) {
            const itfName = (node.pool[itf.name] as UTF8Entry).string;
            edges.push({ parent: itfName, child: name, itf: true });

            if (!processed.has(itfName)) {
                await processRelated(itfName);
            }
        }

        // Process descendants (walking down)
        const childClasses = descendants.get(name);
        if (childClasses) {
            for (const childName of childClasses) {
                if (!processed.has(childName)) {
                    const childEntry = classes.get(childName);
                    if (childEntry?.type === EntryType.CLASS) {
                        const childNode = (childEntry as ClassEntry).node;
                        if (childNode) {
                            // Determine if this is an interface relationship
                            const isInterfaceRelation = childNode.interfaces.some(
                                (itf) => (childNode.pool[itf.name] as UTF8Entry).string === name
                            );

                            edges.push({ parent: name, child: childName, itf: isInterfaceRelation });
                            await processRelated(childName, false);
                        }
                    }
                }
            }
        }
    };

    await process(currentName, node);

    const data: HierarchyNodeData[] = nodes.map((node) => {
        const metrics = computeTextSize(node.name, `400 12px / 18px ${monoFF}`);

        const lines = [...node.fields, ...node.methods].map((f) => `${f.type} ${f.descriptor}`);
        const smallMetrics = computeTextSize(
            lines.reduce((a, b) => (a.length > b.length ? a : b), ""),
            `400 10px / 15px ${monoFF}`
        );

        let width = Math.max(metrics.width, smallMetrics.width) + 20 /* padding */ + 2; /* border */
        let height = 18 + 15 * lines.length /* line height */ + 20 /* padding */ + 2; /* border */
        if (node.fields.length > 0) height += 1 /* separator */ + 20 /* separator padding */;
        if (node.methods.length > 0) height += 1 /* separator */ + 20 /* separator padding */;

        return { node, width, height };
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
