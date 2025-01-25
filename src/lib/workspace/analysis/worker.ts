import { type Node, read } from "@run-slicer/asm";
import { expose } from "comlink";

export interface Worker {
    read(data: Uint8Array, flags: number): Promise<Node>;
}

expose({
    async read(buf: Uint8Array, flags: number): Promise<Node> {
        return read(buf, flags);
    },
} satisfies Worker);
