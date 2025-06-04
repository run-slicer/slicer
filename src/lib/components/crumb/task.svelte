<script lang="ts">
    import { capitalize } from "$lib/utils";
    import Progress from "$lib/components/progress.svelte";
    import type { Task } from "$lib/task";

    interface Props {
        task: Task;
    }

    let { task }: Props = $props();
    let { name, desc, progress } = $derived(task);
</script>

<div class="flex flex-col">
    <span class="mb-1">{capitalize($name)}...</span>
    <Progress value={$progress || 100} indeterminate={!progress} class="h-1" />
    {#if $desc}
        <span class="break-anywhere text-muted-foreground mt-1">{$desc}</span>
    {/if}
</div>
