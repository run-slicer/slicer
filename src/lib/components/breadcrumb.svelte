<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "$lib/components/ui/breadcrumb";
    import { cn } from "$lib/components/utils";
    import type { Tab } from "$lib/tab";

    export let tab: Tab | null;
</script>

<Separator />
<div class="flex h-6 items-center overflow-x-auto px-2 scrollbar-none">
    {#if tab?.entry}
        {@const parts = tab.entry.name.split("/")}
        <Breadcrumb>
            <BreadcrumbList class="flex-nowrap text-xs">
                {#each parts as part, i}
                    {@const last = i === parts.length - 1}
                    <BreadcrumbItem>
                        {#if last && tab?.icon}
                            <svelte:component this={tab.icon.icon} size={14} class={cn("min-w-[14px]", tab.icon.classes)} />
                        {/if}
                        {part}
                    </BreadcrumbItem>
                    {#if !last}
                        <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    {/if}
                {/each}
            </BreadcrumbList>
        </Breadcrumb>
    {/if}
</div>
