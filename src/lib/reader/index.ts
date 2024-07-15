import { type ClassEntry, type Pool, read as readPool } from "./pool";
import { create } from "./stream";

export interface Node {
    minor: number;
    major: number;
    pool: Pool;
    access: number;
    this_: ClassEntry;
    super_?: ClassEntry;
}

export const read = async (s: ReadableStream<Uint8Array>): Promise<Node | null> => {
    const stream = create(s);
    try {
        const magic = await stream.integer();
        if (magic !== 0xcafebabe) {
            return null; // invalid class file header
        }

        const node: Partial<Node> = {
            minor: await stream.unsignedShort(),
            major: await stream.unsignedShort(),
            pool: await readPool(stream),
            access: await stream.unsignedShort(),
        };

        node.this_ = node.pool![await stream.unsignedShort()] as ClassEntry;

        const superIndex = await stream.unsignedShort();
        if (superIndex !== 0) {
            node.super_ = node.pool![superIndex] as ClassEntry;
        }

        return node as Node;
    } finally {
        await stream.close();
    }
};
