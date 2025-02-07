import type { ElkEdgeSection, ElkExtendedEdge, ElkPoint } from "elkjs/lib/elk-api";

const distance = (a: ElkPoint, b: ElkPoint): number => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
const getBend = (a: ElkPoint, b: ElkPoint, c: ElkPoint, size: number): string => {
    const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
    const { x, y } = b;

    if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
        return `L${x} ${y}`;
    }

    if (a.y === y) {
        const xDir = a.x < c.x ? -1 : 1;
        const yDir = a.y < c.y ? 1 : -1;
        return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
    }

    const xDir = a.x < c.x ? 1 : -1;
    const yDir = a.y < c.y ? -1 : 1;
    return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
};

export const getSmoothStepPathFromElk = (edge: ElkExtendedEdge): [string, number | undefined, number | undefined] => {
    if (!edge.sections || edge.sections.length === 0) {
        throw new Error("ElkExtendedEdge must have at least one section");
    }

    const section: ElkEdgeSection = edge.sections[0];
    const points: ElkPoint[] = [section.startPoint, ...(section.bendPoints || []), section.endPoint];

    if (points.length < 2) {
        throw new Error("Edge section must contain at least a start and end point");
    }

    const borderRadius = 5;
    const path = points.reduce<string>((res, p, i) => {
        let segment: string;

        if (i > 0 && i < points.length - 1) {
            segment = getBend(points[i - 1], p, points[i + 1], borderRadius);
        } else {
            segment = `${i === 0 ? "M" : "L"}${p.x} ${p.y}`;
        }

        return res + segment;
    }, "");

    const label = edge.labels?.[0];
    return [path, label?.x, label?.y];
};
