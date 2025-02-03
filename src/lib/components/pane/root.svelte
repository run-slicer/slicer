<script lang="ts" module>
    import { TabType } from "$lib/tab";
    import type { PaneProps } from "./";
    import type { Component } from "svelte";

    export const imports: Record<TabType, () => Promise<{ default: Component<PaneProps> }>> = {
        [TabType.PROJECT]: () => import("./tree/tree.svelte"),
        [TabType.LOGGING]: () => import("./logging/logging.svelte"),
        [TabType.WELCOME]: () => import("./welcome/welcome.svelte"),
        [TabType.CODE]: () => import("./code/code.svelte"),
        [TabType.HEX]: () => import("./code/code.svelte"),
        [TabType.FLOW_GRAPH]: () => import("./flow/flow.svelte"),
        [TabType.IMAGE]: () => import("./image/image.svelte"),
        [TabType.HEAP_DUMP]: () => import("./dump/dump.svelte"),
        [TabType.CLASS]: () => import("./class/class.svelte"),
    };
</script>

<script lang="ts">
    import Loading from "$lib/components/loading.svelte";
    import { TabPosition } from "$lib/tab";

    let props: PaneProps = $props();
</script>

{#await imports[props.tab.type]()}
    <Loading value="Loading..." center={props.tab.position !== TabPosition.PRIMARY_CENTER} />
{:then { default: PaneComponent }}
    <PaneComponent {...props} />
{/await}
