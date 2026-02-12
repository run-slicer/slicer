import type { EventHandler } from "$lib/event";
import { prettyInternalName, prettyJavaType, prettyMethodDesc } from "$lib/utils";
import { memberEntry } from "$lib/workspace";
import { type CallGraph, type InheritanceGraph, WalkDirection } from "$lib/workspace/analysis/graph";
import type { Node as ClassNode, Member } from "@katana-project/asm";
import { escapeLiteral, formatEntry, formatInsn } from "@katana-project/asm/analysis/disasm";
import { computeGraph, EdgeType, type Node as GraphNode } from "@katana-project/asm/analysis/graph";
import type { BootstrapMethodsAttribute, CodeAttribute } from "@katana-project/asm/attr";
import { AttributeType } from "@katana-project/asm/spec";
import type { Edge, MarkerType, Node } from "@xyflow/svelte";
import ELK, { type ElkNode } from "elkjs/lib/elk-api";

export enum GraphType {
    CONTROL_FLOW = "control-flow",
    CALL = "call",
    HIERARCHY = "hierarchy",
}

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

const callLayoutOptions = {
    ...commonOptions,
    "elk.direction": "RIGHT",
    "elk.layered.mergeEdges": "true",
    "elk.spacing.portPort": "2",
    "elk.layered.spacing.nodeNodeBetweenLayers": "40",
};

const hierarchyLayoutOptions = {
    ...commonOptions,
    "elk.direction": "UP",
};

const elk = new ELK({ workerFactory: () => new Worker(new URL("elkjs/lib/elk-worker.js", import.meta.url)) });

export const computeControlFlowGraph = async (
    node: ClassNode,
    method: Member,
    withExcHandlers: boolean
): Promise<[Node[], Edge[]]> => {
    const attr = method.attrs.find((a) => a.type === AttributeType.CODE);
    if (!attr) {
        return [[], []]; // no Code attribute
    }

    const code = attr as CodeAttribute;
    const { nodes, edges } = computeGraph(code);

    const pool = node.pool;
    const bsmAttr = node.attrs.find((a) => a.type === AttributeType.BOOTSTRAP_METHODS) as
        | BootstrapMethodsAttribute
        | undefined;

    const excEdges = (withExcHandlers ? nodes : []).flatMap((node) => {
        return code.exceptionTable
            .filter((e) => node.offset >= e.startPC && node.insns[node.insns.length - 1].offset < e.endPC)
            .map((e) => ({
                source: node.offset,
                target: e.handlerPC,
                // https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.7.3 (exception_table[] -> catch_type)
                catchType: e.catchType === 0 ? "*" : formatEntry(pool[e.catchType]!, pool, bsmAttr),
            }));
    });

    const data: ControlFlowNodeData[] = nodes.map((node) => {
        const lines = node.insns.map((i) => formatInsn(code, bsmAttr ?? null, i, pool, false));
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
    displayName: string;
    fields: MemberData[];
    methods: MemberData[];

    open?: () => void;
}

const IMPLICIT_SUPER = new Set([
    "java/lang/Object",
    "java/lang/Enum",
    "java/lang/Record",
    "java/lang/annotation/Annotation",
]);

export const computeHierarchyGraph = async (
    node: ClassNode,
    inheritanceGraph: InheritanceGraph,
    withSubtypes: boolean,
    handler?: EventHandler
): Promise<[Node[], Edge[]]> => {
    const currentName = node.thisClass.nameEntry!.string;
    const currentNode = inheritanceGraph[currentName];
    if (!currentNode) {
        return [[], []]; // class not found in graph
    }

    const graphNodes = new Set(
        currentNode.walk(withSubtypes ? WalkDirection.BOTH : WalkDirection.UP, (n) =>
            IMPLICIT_SUPER.has(n.name) ? null : n
        )
    );

    // make sure we have both sides of the edge
    const edges = Array.from(graphNodes.values())
        .flatMap((n) => n.edges)
        .filter((e) => graphNodes.has(e.sub) && graphNodes.has(e.super));

    const nodes = Array.from(graphNodes.values()).map<HierarchyNode>((node) => ({
        name: node.name,
        displayName: prettyInternalName(node.name, !!(handler && node.entry)),
        fields:
            node.entry?.node?.fields?.map((f) => ({
                type: prettyJavaType(f.type.string, true),
                descriptor: escapeLiteral(f.name.string),
            })) || [],
        methods:
            node.entry?.node?.methods?.map((m) => ({
                type: prettyJavaType(m.type.string.substring(m.type.string.lastIndexOf(")") + 1), true),
                descriptor: escapeLiteral(m.name.string) + prettyMethodDesc(m.type.string),
            })) || [],
        open: handler && node.entry ? () => handler?.open(node.entry!) : undefined,
    }));

    const data: HierarchyNodeData[] = nodes.map((node) => {
        const metrics = computeTextSize(node.displayName, `400 12px / 18px ${monoFF}`);

        const lines = [...node.fields, ...node.methods].map((f) => `${f.type} ${f.descriptor}`);
        const smallMetrics = computeTextSize(
            lines.reduce((a, b) => (a.length > b.length ? a : b), ""),
            `400 10px / 15px ${monoFF}`
        );

        let width = Math.max(metrics.width, smallMetrics.width) + 20 /* padding */ + 2; /* border */
        let height = 18 + 15 * lines.length /* line height */ + 20 /* padding */ + 2; /* border */
        if (node.fields.length > 0) height += 1 /* separator */ + 20 /* separator padding */;
        if (node.methods.length > 0) height += 1 /* separator */ + 20 /* separator padding */;

        if (node.name !== node.displayName) height += 1; // underline

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
            id: `${e.sub.name}-${e.super.name}`,
            targets: [`${e.super.name}`],
            sources: [`${e.sub.name}`],
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
            id: `${edge.sub.name}-${edge.super.name}`,
            type: "auto-edge",
            source: edge.sub.name,
            target: edge.super.name,
            animated: edge.itf,
            markerEnd: {
                type: "arrowclosed" as MarkerType /* skip non-type import */,
            },
            data: layout.edges?.find((e) => e.id === `${edge.sub.name}-${edge.super.name}`)! as unknown as Record<
                string,
                unknown
            >,
        })),
    ];
};

interface CallGraphNode {
    id: string;
    owner: string;
    ownerDisplayName: string;
    name: string;
    type: string;

    open?: () => void;
    openMember?: () => void;
}

export type CallGraphNodeData = {
    node: CallGraphNode;
    width: number;
    height: number;
};

export const computeCallGraph = async (callGraph: CallGraph, handler?: EventHandler): Promise<[Node[], Edge[]]> => {
    const nodes = Object.values(callGraph);
    const edges = nodes.flatMap((n) => n.edges);

    const data: CallGraphNodeData[] = nodes.map((node) => {
        const cgNode: CallGraphNode = {
            id: node.id,
            owner: node.owner,
            ownerDisplayName: prettyInternalName(node.owner, !!(handler && node.ownerEntry)),
            name: node.name,
            type: prettyMethodDesc(node.type, true),
            open: handler && node.ownerEntry ? () => handler.open(node.ownerEntry!) : undefined,
            openMember:
                handler && node.ownerEntry && node.member
                    ? () => handler.open(memberEntry(node.ownerEntry!, node.member!))
                    : undefined,
        };

        const lines = [`${cgNode.ownerDisplayName}#${cgNode.name}${cgNode.type}`];
        const metrics = computeTextSize(
            lines.reduce((a, b) => (a.length > b.length ? a : b)),
            `400 12px / 18px ${monoFF}`
        );

        return {
            node: cgNode,
            lines,
            width: metrics.width + 20 /* padding */ + 2 /* border */,
            height: 18 /* line height */ * lines.length + 20 /* padding */ + 2 /* border */,
        };
    });

    const graph: ElkNode = {
        id: "root",
        children: data.map((d) => ({
            id: d.node.id,
            width: d.width,
            height: d.height,
        })),
        edges: edges.map((e) => ({
            id: `${e.caller.id}-${e.callee.id}`,
            targets: [`${e.callee.id}`],
            sources: [`${e.caller.id}`],
        })),
    };

    const layout = await elk.layout(graph, { layoutOptions: callLayoutOptions });
    return [
        data.map((d) => {
            const elkNode = layout.children?.find((n) => n.id === d.node.id);

            return {
                id: d.node.id,
                type: "call-node",
                data: d,
                position: {
                    x: elkNode?.x ?? 0,
                    y: elkNode?.y ?? 0,
                },
                // highlight current node
                style: d.node.id === nodes[0].id ? "border: 1px solid var(--primary);" : undefined,
            };
        }),
        edges.map((edge) => ({
            id: `${edge.caller.id}-${edge.callee.id}`,
            type: "auto-edge",
            source: edge.caller.id,
            target: edge.callee.id,
            markerEnd: {
                type: "arrowclosed" as MarkerType /* skip non-type import */,
            },
            data: layout.edges?.find((e) => e.id === `${edge.caller.id}-${edge.callee.id}`)! as unknown as Record<
                string,
                unknown
            >,
        })),
    ];
};
