<script lang="ts">
    import type { Task } from "$lib/task";
    import { LoaderCircle } from "lucide-svelte";
    import { capitalize } from "$lib/utils";
    import { Popover, PopoverTrigger, PopoverContent } from "$lib/components/ui/popover";
    import TaskComponent from "./task.svelte";

    interface Props {
        tasks: Task[];
    }

    let { tasks }: Props = $props();
    let mainName = $derived(tasks[0]?.name);
</script>

{#if tasks.length > 0}
    <Popover>
        <PopoverTrigger class="flex flex-row items-center">
            <LoaderCircle size={12} class="mr-1 animate-spin text-primary" />

            <span>{capitalize($mainName)}...{tasks.length > 1 ? ` (+ ${tasks.length - 1} more)` : ""}</span>
        </PopoverTrigger>
        <PopoverContent class="z-30 flex max-h-64 w-72 flex-col p-0" side="top" align="end" sideOffset={14}>
            <p class="border-b border-b-border px-4 py-2 text-center text-sm font-medium">
                Tasks ({tasks.length})
            </p>
            <div class="flex flex-col gap-4 overflow-auto p-4 text-xs">
                {#each tasks.slice(0, 25) as task (task.id)}
                    <TaskComponent {task} />
                {/each}
                {#if tasks.length > 25}
                    <p class="text-center text-muted-foreground">+ {tasks.length - 25} more</p>
                {/if}
            </div>
        </PopoverContent>
    </Popover>
{/if}
