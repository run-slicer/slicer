import { type Node, type Edge, MarkerType } from "@xyflow/svelte";
import type { Member } from "@run-slicer/asm";
import type { CodeAttribute } from "@run-slicer/asm/attr";
import { AttributeType, Opcode, OPCODE_MNEMONICS } from "@run-slicer/asm/spec";
import { type Node as GraphNode, EdgeType, computeGraph } from "@run-slicer/asm/analysis/graph";
import { layout, graphlib } from "@dagrejs/dagre";
import type {
    Pool,
    ClassEntry,
    UTF8Entry,
    DynamicEntry,
    NameTypeEntry,
    RefEntry,
} from "@run-slicer/asm/pool";
import type {
    Instruction,
    TypeInstruction,
    PushInstruction,
    IncrementInstruction,
    WideInstruction,
    InvokeInstruction,
} from "@run-slicer/asm/insn";

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

const stringifyInsn = (insn: Instruction, pool: Pool): string => {
    // TODO: finish all opcodes
    let value = OPCODE_MNEMONICS[insn.opcode] || "<unknown opcode>";
    switch (insn.opcode) {
        case Opcode.ALOAD:
        case Opcode.ASTORE:
        case Opcode.DLOAD:
        case Opcode.DSTORE:
        case Opcode.FLOAD:
        case Opcode.FSTORE:
        case Opcode.ILOAD:
        case Opcode.ISTORE:
        case Opcode.LLOAD:
        case Opcode.LSTORE:
        case Opcode.RET:
        case Opcode.GETFIELD:
        case Opcode.GETSTATIC:
        case Opcode.PUTFIELD:
        case Opcode.PUTSTATIC:
            break;
        case Opcode.IINC:
            const iincInsn = insn as IncrementInstruction;

            value += ` ${iincInsn.index} ${iincInsn.const}`;
            break;
        case Opcode.WIDE:
            const wideInsn = insn as WideInstruction;

            value += ` ${OPCODE_MNEMONICS[wideInsn.insn.opcode] || "<unknown opcode>"}`;
            switch (wideInsn.insn.opcode) {
                case Opcode.IINC: {
                    const iincInsn = wideInsn.insn as IncrementInstruction;

                    value += ` ${iincInsn.index} ${iincInsn.const}`;
                    break;
                }
            }
            break;
        case Opcode.INVOKEDYNAMIC:
        case Opcode.INVOKEINTERFACE:
        case Opcode.INVOKESPECIAL:
        case Opcode.INVOKESTATIC:
        case Opcode.INVOKEVIRTUAL:
            const invokeInsn = insn as InvokeInstruction;
            if (invokeInsn.opcode === Opcode.INVOKEDYNAMIC) {
                const indyInfo = pool[invokeInsn.ref] as DynamicEntry;
                const nameType = pool[indyInfo.nameType] as NameTypeEntry;

                value += ` ${indyInfo.bsmIndex}`;
                value += ` ${(pool[nameType.name] as UTF8Entry).decode()} ${(pool[nameType.type_] as UTF8Entry).decode()}`;
            } else {
                const refInfo = pool[invokeInsn.ref] as RefEntry;

                const clazz = pool[refInfo.ref] as ClassEntry;
                const nameType = pool[refInfo.nameType] as NameTypeEntry;

                value += ` ${(pool[clazz.name] as UTF8Entry).decode()}`;
                value += ` ${(pool[nameType.name] as UTF8Entry).decode()} ${(pool[nameType.type_] as UTF8Entry).decode()}`;
            }

            break;
        case Opcode.LDC:
        case Opcode.LDC_W:
        case Opcode.LDC2_W:
            break;
        case Opcode.CHECKCAST:
        case Opcode.INSTANCEOF:
        case Opcode.NEW:
            const typeInsn = insn as TypeInstruction;
            const nameEntry = pool[(pool[typeInsn.index] as ClassEntry).name] as UTF8Entry;

            value += ` ${nameEntry.decode()}`;
            break;
        case Opcode.BIPUSH:
        case Opcode.SIPUSH:
            const pushInsn = insn as PushInstruction;

            value += ` ${pushInsn.value}`;
            break;
        case Opcode.ANEWARRAY:
        case Opcode.NEWARRAY:
        case Opcode.MULTIANEWARRAY:
            break;
    }

    return value;
};

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
        const lines = node.insns.map((i) => stringifyInsn(i, pool));
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
                    type: MarkerType.ArrowClosed,
                },
            };
        }),
    ];
};
