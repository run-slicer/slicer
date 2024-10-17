<script lang="ts" context="module">
    import { writable } from "svelte/store";

    const label0 = writable<string | null>(null);

    type LoadingAction<T> = (updateLabel: (label: string) => void) => T | PromiseLike<T>;
    export const loading = async <T,>(label: string, action: LoadingAction<T>): Promise<T> => {
        label0.set(label);
        const value = await action(label0.set);
        label0.set(null);

        return value;
    };
</script>

<script lang="ts">
    import Loading from "./loading.svelte";
</script>

{#if $label0}
    <Loading class="mt-32" value={$label0} />
{/if}
