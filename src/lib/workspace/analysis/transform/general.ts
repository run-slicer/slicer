import { ShieldCheck } from "@lucide/svelte";
import { write } from "@run-slicer/asm";
import type { Transformer } from "./";

export default [
    {
        id: "verify",
        name: "Verify attributes",
        icon: ShieldCheck,
        async run(entry, _data) {
            const { verify } = await import("@run-slicer/asm/analysis/verify");
            entry.node = verify(entry.node);

            return write(entry.node);
        },
    },
] satisfies Transformer[];
