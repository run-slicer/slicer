<script lang="ts">
    import type { Node } from "@run-slicer/asm";
    import type { UTF8Entry } from "@run-slicer/asm/pool";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();

    const name = (node.pool[node.thisClass.name] as UTF8Entry).decode();
</script>

{name}
