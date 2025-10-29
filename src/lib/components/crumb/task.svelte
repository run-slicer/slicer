<script lang="ts">
    import { t } from "$lib/i18n";
    import Progress from "$lib/components/progress.svelte";
    import type { Task } from "$lib/task";

    interface Props {
        task: Task;
    }

    let { task }: Props = $props();
    let { name, desc, progress } = $derived(task);
</script>

<div class="flex flex-col">
    <span class="mb-1">{$t("crumb.tasks.task", $t($name))}</span>
    <Progress value={$progress || 100} indeterminate={!progress} class="h-1" />
    {#if $desc}
        <span class="break-anywhere text-muted-foreground mt-1">{$desc}</span>
    {/if}
</div>
