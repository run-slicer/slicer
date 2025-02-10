import type { Member } from "@run-slicer/asm";
import { formatEntry, formatInsn } from "@run-slicer/asm/analysis/disasm";
import { type Node as GraphNode, EdgeType, computeGraph } from "@run-slicer/asm/analysis/graph";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import type { Pool } from "@run-slicer/asm/pool";
import { AttributeType } from "@run-slicer/asm/spec";
import type { Edge, MarkerType, Node } from "@xyflow/svelte";
import ELK, { type ElkNode } from "elkjs/lib/elk-api";

export type NodeData = {
    node: GraphNode;
    lines: string[];
    width: number;
    height: number;
};

const monoFont = `400 12px / 18px "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

const canvas = document.createElement("canvas");
const computeTextSize = (text: string): TextMetrics => {
    const context = canvas.getContext("2d")!;
    context.font = monoFont;

    return context.measureText(text);
};

const elk = new ELK({
    defaultLayoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "elk.spacing.nodeNode": "80",
        "elk.layered.spacing.nodeNodeBetweenLayers": "80",
        "elk.portAlignment.default": "CENTER",
        "elk.portConstraints": "FIXED_SIDE",
        "elk.edgeRouting": "ORTHOGONAL",
    },
    workerFactory: () => new Worker(new URL("elkjs/lib/elk-worker.js", import.meta.url)),
});

export const createComputedGraph = async (
    method: Member | null,
    pool: Pool,
    withExcHandlers: boolean
): Promise<[Node[], Edge[]]> => {
    if (!method) {
        return [[], []]; // no method
    }

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

    const data: NodeData[] = nodes.map((node) => {
        const lines = node.insns.map((i) => formatInsn(code, i, pool, false));
        const metrics = computeTextSize(lines.reduce((a, b) => (a.length > b.length ? a : b)));

        return {
            node,
            lines,
            width: metrics.width + 24,
            height: (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) * lines.length * 1.125 + 24,
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

    const layout = await elk.layout(graph);
    return [
        data.map((d) => {
            const elkNode = layout.children?.find((n) => n.id === `${d.node.offset}`);

            return {
                id: `${d.node.offset}`,
                type: "elk-node",
                data: d,
                position: {
                    x: elkNode?.x ?? 0,
                    y: elkNode?.y ?? 0,
                },
                // highlight entrypoint node
                style: d.node.offset === 0 ? "border: 1px solid hsl(var(--primary));" : undefined,
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
                    type: "elk-edge",
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
                type: "elk-edge",
                style: "stroke: hsl(var(--destructive));",
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
