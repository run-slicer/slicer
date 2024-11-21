<script lang="ts">
    import type { Task } from "$lib/task";
    import { LoaderCircle } from "lucide-svelte";
    import { capitalize } from "$lib/utils";
    import { Popover, PopoverTrigger, PopoverContent } from "$lib/components/ui/popover";
    import Progress from "$lib/components/progress.svelte";

    interface Props {
        tasks: Task[];
    }

    let { tasks }: Props = $props();
</script>

{#if tasks.length > 0}
    {@const mainTask = tasks[tasks.length - 1]}
    <Popover>
        <PopoverTrigger class="flex flex-row items-center">
            <LoaderCircle size={12} class="mr-1 animate-spin text-primary" />
            <span>{capitalize(mainTask.name)}...</span>
        </PopoverTrigger>
        <PopoverContent class="z-30 flex max-h-64 w-72 flex-col p-0" side="top" align="end" sideOffset={14}>
            <p class="border-b border-b-border px-4 py-2 text-center text-sm font-medium">Tasks</p>
            <div class="flex flex-col gap-4 overflow-auto p-4 text-xs">
                {#each tasks as task (task.id)}
                    <div class="flex flex-col">
                        <span class="mb-1">{capitalize(task.name)}...</span>
                        <Progress value={100} indeterminate class="h-1" />
                        <span class="mt-1 text-muted-foreground">{task.desc}</span>
                    </div>
                {/each}
            </div>
        </PopoverContent>
    </Popover>
{/if}
