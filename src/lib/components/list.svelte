<script lang="ts">
    import { VList } from "virtua/svelte";
    import type { ComponentEvents, ComponentProps } from "svelte";

    type T = $$Generic;
    type $$Props = ComponentProps<VList<T>>;
    type $$Events = ComponentEvents<VList<T>>;
    type $$Slots = { default: { item: T; index: number } };

    export let data: $$Props["data"] = [];
</script>

{#key data.length}
    <VList {data} {...$$restProps} let:item let:index>
        <slot {item} {index} />
    </VList>
{/key}
