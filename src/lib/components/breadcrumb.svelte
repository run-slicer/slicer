<script lang="ts" context="module">
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
    import { fileIcon } from "$lib/components/icons";

    export let tab: Tab | null;
    export let encoding: Encoding | null;
</script>

<Separator />
<div class="flex h-6 items-center justify-between overflow-x-auto px-2 scrollbar-none">
    {#if tab?.entry}
        {@const entries = flatten(tab.entry)}
        <Breadcrumb>
            <BreadcrumbList class="flex-nowrap text-xs">
                {#each entries as entry, x}
                    {@const parts = entry.data.name.split("/")}
                    {@const lastEntry = x === entries.length - 1}
                    {#each parts as part, y}
                        {@const lastPart = y === parts.length - 1}
                        <BreadcrumbItem>
                            {#if lastPart}
                                {@const icon = fileIcon(entry.data.name)}
                                <svelte:component this={icon.icon} size={14} class={cn("min-w-[14px]", icon.classes)} />
                            {/if}
                            {part}
                        </BreadcrumbItem>
                        {#if !lastEntry || !lastPart}
                            <BreadcrumbSeparator>/</BreadcrumbSeparator>
                        {/if}
                    {/each}
                {/each}
            </BreadcrumbList>
        </Breadcrumb>
        {#if encoding && isEncodingDependent(tab)}
            <div class="text-xs text-muted-foreground">
                {encoding.label || encoding.id.toUpperCase()}
            </div>
        {/if}
    {/if}
</div>
