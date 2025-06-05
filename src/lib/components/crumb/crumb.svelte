<script lang="ts" module>
    import type { Entry } from "$lib/workspace";

    export const flatten = (entry: Entry): Entry[] => {
        const stack = [entry];
        while (entry.parent) {
            entry = entry.parent;
            stack.push(entry);
        }

        return stack.reverse();
    };
</script>

<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "$lib/components/ui/breadcrumb";
    import { cn } from "$lib/components/utils";
    import { isEncodingDependent, type Tab } from "$lib/tab";
    import type { Encoding } from "$lib/workspace/encoding";
    import { entryIcon } from "$lib/components/icons";
    import type { Task } from "$lib/task";
    import Tasks from "./tasks.svelte";

    interface Props {
        tab: Tab | null;
        tasks: Task[];
        encoding: Encoding | null;
    }

    let { tab, tasks, encoding }: Props = $props();
</script>

<Separator />
<div class="scrollbar-none flex h-6 items-center justify-between overflow-x-auto px-2">
    <Breadcrumb>
        {#if tab?.entry}
            {@const entries = flatten(tab.entry)}
            <BreadcrumbList class="flex-nowrap text-xs">
                {#each entries as entry, x}
                    {@const parts = entry.data.name.split("/")}
                    {@const lastEntry = x === entries.length - 1}
                    {#each parts as part, y}
                        {@const lastPart = y === parts.length - 1}
                        <BreadcrumbItem class="whitespace-nowrap">
                            {#if lastPart}
                                {@const { icon: FileIcon, classes } = entryIcon(entry)}
                                <FileIcon size={14} class={cn("min-w-[14px]", classes)} />
                            {/if}
                            {part}
                        </BreadcrumbItem>
                        {#if !lastEntry || !lastPart}
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {/if}
                    {/each}
                {/each}
            </BreadcrumbList>
        {/if}
    </Breadcrumb>
    <div class="text-muted-foreground flex flex-row text-xs">
        <Tasks {tasks} />
        {#if tab && encoding && isEncodingDependent(tab)}
            {#if tasks.length > 0}
                <span class="text-muted-foreground/60 px-2">|</span>
            {/if}
            <span>{encoding.label || encoding.id.toUpperCase()}</span>
        {/if}
    </div>
</div>
