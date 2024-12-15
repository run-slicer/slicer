import { graphlib, layout } from "@dagrejs/dagre";
import type { Member } from "@run-slicer/asm";
import { type Node as GraphNode, EdgeType, computeGraph } from "@run-slicer/asm/analysis/graph";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import { formatInsn } from "@run-slicer/asm/insn";
import { type Pool, formatEntry } from "@run-slicer/asm/pool";
import { AttributeType } from "@run-slicer/asm/spec";
import type { Edge, MarkerType, Node } from "@xyflow/svelte";

export type NodeData = {
    node: GraphNode;
    lines: string[];
    width: number;
    height: number;
};

const bodyStyle = window.getComputedStyle(document.body, null);
const getBodyStyle = (prop: string): string => bodyStyle.getPropertyValue(prop);

const bodyFont = `${getBodyStyle("font-weight")} ${getBodyStyle("font-size")} ${getBodyStyle("font-family")}`;

const canvas = document.createElement("canvas");
const computeTextSize = (text: string): TextMetrics => {
    const context = canvas.getContext("2d")!;
    context.font = bodyFont;

    return context.measureText(text);
};

export const createComputedGraph = (method: Member | null, pool: Pool, handlerEdges: boolean): [Node[], Edge[]] => {
    if (!method) {
        return [[], []]; // no method
    }

    const attr = method.attrs.find((a) => a.name === AttributeType.CODE);
    if (!attr) {
        return [[], []]; // no Code attribute
    }

    const code = attr as CodeAttribute;

    const { nodes, edges } = computeGraph(code);

    const data: NodeData[] = nodes.map((node) => {
        const lines = node.insns.map((i) => formatInsn(i, pool));
        const metrics = computeTextSize(lines.reduce((a, b) => (a.length > b.length ? a : b)));

        return {
            node,
            lines,
            width: metrics.width,
            height: (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) * lines.length,
        };
    });

    const graph = new graphlib.Graph();
    graph.setGraph({ rankdir: "TB", nodesep: 150, edgesep: 100, ranksep: 100, ranker: "longest-path" });
    graph.setDefaultEdgeLabel(() => ({}));

    data.forEach((nodeData) => {
        graph.setNode(`${nodeData.node.offset}`, {
            width: nodeData.width,
            height: nodeData.height,
        });
    });

    edges.forEach((edge) => {
        graph.setEdge(`${edge.source}`, `${edge.target}`);
    });

    layout(graph);

    return [
        data.map((nodeData) => {
            const positionedNode = graph.node(`${nodeData.node.offset}`);

            return {
                id: `${nodeData.node.offset}`,
                type: "block",
                data: nodeData,
                position: {
                    x: positionedNode.x - nodeData.width / 2,
                    y: positionedNode.y - nodeData.height / 2,
                },
                // highlight entrypoint node
                style: nodeData.node.offset === 0 ? "border: 1px solid hsl(var(--primary));" : undefined,
            };
        }),
        [
            // jumps and immediate edges
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
                }

                return {
                    id: `edge-${edge.source}-${edge.target}`,
                    type: "smoothstep",
                    label,
                    source: `${edge.source}`,
                    target: `${edge.target}`,
                    animated: !edge.jump,
                    markerEnd: {
                        type: "arrowclosed" as MarkerType /* skip non-type import */,
                    },
                };
            }),
            // exception handlers
            ...(handlerEdges ? nodes : []).flatMap((node) => {
                return code.exceptionTable
                    .filter((e) => node.offset >= e.startPC && node.insns[node.insns.length - 1].offset < e.endPC)
                    .map((e) => ({
                        id: `edge-exc-${node.offset}-${e.handlerPC}`,
                        type: "smoothstep",
                        style: "stroke: hsl(var(--destructive));",
                        // https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html#jvms-4.7.3 (exception_table[] -> catch_type)
                        label: e.catchType === 0 ? "*" : formatEntry(pool[e.catchType]!, pool),
                        source: `${node.offset}`,
                        target: `${e.handlerPC}`,
                        markerEnd: {
                            type: "arrowclosed" as MarkerType /* skip non-type import */,
                        },
                    }));
            }),
        ],
    ];
};
