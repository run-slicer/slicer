<script lang="ts">
    import { Separator } from "$lib/components/ui/separator";
    import { current as currentTab } from "$lib/tab";
    import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "$lib/components/ui/breadcrumb";
    import { cn } from "$lib/components/utils";

    $: path = $currentTab?.entry?.name;
    $: icon = $currentTab?.icon;
</script>

<Separator />
<div class="flex h-6 items-center overflow-x-auto px-2 text-sm text-muted-foreground scrollbar-none">
    {#if path}
        {@const parts = path.split("/")}
        <Breadcrumb>
            <BreadcrumbList class="flex-nowrap">
                {#each parts as part, i}
                    {@const last = i === parts.length - 1}
                    <BreadcrumbItem>
                        {#if last && icon}
                            <svelte:component this={icon.icon} size={16} class={cn("min-w-[16px]", icon.classes)} />
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
