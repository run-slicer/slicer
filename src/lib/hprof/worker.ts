import { read, type SlurpResult } from "./reader";
import type { Worker } from "./";
import { expose } from "comlink";

expose({
    async read(blob: Blob): Promise<SlurpResult> {
        let offset = 0;
        const stream = new ReadableStream({
            async pull(controller) {
                const toRead = Math.min(1024 * 1024 * 20, blob.size - offset);
                const slice = blob.slice(offset, offset + toRead);

                controller.enqueue(new Uint8Array(await slice.arrayBuffer()));
                if (slice.size === blob.size - offset) {
                    controller.close();
                }

                offset += toRead;
            },
        });

        return read(stream);
    },
} satisfies Worker);
