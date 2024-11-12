<script lang="ts">
    import type { ComponentType } from "svelte";
    import Loading from "./loading.svelte";

    export let component: () => Promise<{ default: ComponentType }>;
</script>

{#await component().then(({ default: C }) => C)}
    <Loading value="Loading..." />
{:then Component}
    <Component {...$$restProps} on:action />
{/await}
