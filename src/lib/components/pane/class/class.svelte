<script lang="ts">
    import { TabType } from "$lib/tab";
    import type { ClassEntry } from "$lib/workspace";
    import { Tabs, TabsList, TabsContent, TabsTrigger } from "$lib/components/ui/tabs";
    import { Code, Ellipsis, FileQuestion, GitBranchPlus } from "@lucide/svelte";
    import Pool from "./pool.svelte";
    import Fields from "./fields.svelte";
    import Methods from "./methods.svelte";
    import Overview from "./overview.svelte";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "$lib/components/ui/dropdown-menu";
    import { Button } from "$lib/components/ui/button";
    import type { PaneProps } from "$lib/components/pane";
    import { t } from "$lib/i18n";

    let { tab, handler }: PaneProps = $props();

    const entry = $derived(tab.entry as ClassEntry | undefined);
    const node = $derived(entry?.node);
</script>

{#if entry && node}
    <Tabs value="overview" class="flex h-full w-full flex-col p-2">
        <div class="flex flex-row gap-1">
            <TabsList class="grid w-full grid-cols-4">
                <TabsTrigger value="overview">{$t("pane.class.tab.overview")}</TabsTrigger>
                <TabsTrigger value="constant_pool">{$t("pane.class.tab.constant-pool")}</TabsTrigger>
                <TabsTrigger value="fields">{$t("pane.class.tab.fields")}</TabsTrigger>
                <TabsTrigger value="methods">{$t("pane.class.tab.methods")}</TabsTrigger>
            </TabsList>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    {#snippet child({ props })}
                        <Button {...props} variant="secondary" size="icon">
                            <span class="sr-only">Open menu</span>
                            <Ellipsis size={16} />
                        </Button>
                    {/snippet}
                </DropdownMenuTrigger>
                <DropdownMenuContent class="min-w-48" align="end">
                    <DropdownMenuItem class="justify-between" onclick={() => handler.open(entry, TabType.CODE)}>
                        {$t("pane.class.menu.disasm")}
                        <Code size={16} />
                    </DropdownMenuItem>
                    <DropdownMenuItem class="justify-between" onclick={() => handler.open(entry, TabType.GRAPH)}>
                        {$t("pane.class.menu.graph")}
                        <GitBranchPlus size={16} />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <!-- https://github.com/tailwindlabs/tailwindcss/pull/4873#issuecomment-987729814 -->
        <TabsContent value="overview" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Overview {node} />
        </TabsContent>
        <TabsContent value="constant_pool" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Pool {node} />
        </TabsContent>
        <TabsContent value="fields" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Fields {node} />
        </TabsContent>
        <TabsContent value="methods" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Methods {entry} {handler} />
        </TabsContent>
    </Tabs>
{:else}
    <div class="flex h-full w-full flex-col items-center justify-center">
        <FileQuestion class="mb-4 animate-bounce text-red-600" size={128} />
        <p class="mb-1 text-2xl font-semibold">{$t("pane.class.fail.title")}</p>
        <p class="text-muted-foreground mb-32 text-sm">{$t("pane.class.fail.subtitle")}</p>
    </div>
{/if}
