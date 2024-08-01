import { type Node, type Edge, MarkerType } from "@xyflow/svelte";
import type { Member } from "@run-slicer/asm";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import { AttributeType, OPCODE_MNEMONICS } from "@run-slicer/asm/spec";
import { type Node as GraphNode, computeGraph } from "@run-slicer/asm/analysis/graph";
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

export const createComputedGraph = (method: Member | null): [Node[], Edge[]] => {
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
        const lines = node.insns.map((insn) => {
            return OPCODE_MNEMONICS[insn.opcode] || "<unknown opcode>";
        });

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
            return {
                id: `edge-${edge.source}-${edge.target}`,
                type: "smoothstep",
                source: `${edge.source}`,
                target: `${edge.target}`,
                animated: !edge.jump,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                },
            };
        }),
    ];
};
