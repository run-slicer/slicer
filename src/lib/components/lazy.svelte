<script lang="ts">
    import type { ComponentType } from "svelte";
    import Loading from "./loading.svelte";

    export let component: () => Promise<{ default: ComponentType }>;
</script>

{#await component().then(({ default: C }) => C)}
    <Loading value="Loading..." />
{:then Component}
    <!-- TODO: get rid of the event bubble -->
    <Component {...$$restProps} on:action />
{/await}
