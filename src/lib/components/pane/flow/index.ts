import type { Node, Edge, MarkerType } from "@xyflow/svelte";
import type { Member } from "@run-slicer/asm";
import type { Pool } from "@run-slicer/asm/pool";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import { AttributeType } from "@run-slicer/asm/spec";
import { formatInsn } from "@run-slicer/asm/insn";
import { type Node as GraphNode, EdgeType, computeGraph } from "@run-slicer/asm/analysis/graph";
import { layout, graphlib } from "@dagrejs/dagre";

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

const NODE_MARGIN = 25;

export const createComputedGraph = (method: Member | null, pool: Pool): [Node[], Edge[]] => {
    if (!method) {
        return [[], []]; // no method
    }

    const attr = method.attrs.find((a) => a.name === AttributeType.CODE);
    if (!attr) {
        return [[], []]; // no Code attribute
    }

    const code = attr as CodeAttribute;

    const { nodes, edges } = computeGraph(code.insns);

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
    graph.setGraph({ rankdir: "TB" });
    graph.setDefaultEdgeLabel(() => ({}));

    data.forEach((nodeData) => {
        graph.setNode(`${nodeData.node.offset}`, {
            width: nodeData.width + NODE_MARGIN,
            height: nodeData.height + NODE_MARGIN,
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
            };
        }),
        edges.map((edge) => {
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
    ];
};
