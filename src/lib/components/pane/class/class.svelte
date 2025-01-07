<script lang="ts">
    import { type Tab, TabType } from "$lib/tab";
    import type { ClassEntry } from "$lib/workspace";
    import { Tabs, TabsList, TabsContent, TabsTrigger } from "$lib/components/ui/tabs";
    import { Code, Ellipsis, FileQuestion, GitBranchPlus } from "lucide-svelte";
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
    import type { EventHandler } from "$lib/event";

    interface Props {
        tab: Tab;
        handler: EventHandler;
    }

    let { tab, handler }: Props = $props();

    const entry = $derived(tab.entry as ClassEntry | undefined);
    const node = $derived(entry?.node);
</script>

{#if entry && node}
    <Tabs value="overview" class="flex h-full w-full flex-col p-2">
        <div class="flex flex-row gap-1">
            <TabsList class="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="constant_pool">Constant pool</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="methods">Methods</TabsTrigger>
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
                <DropdownMenuContent class="w-[12rem]" align="end">
                    <DropdownMenuItem class="justify-between" onclick={() => handler.open(entry, TabType.CODE)}>
                        Disassemble <Code size={16} />
                    </DropdownMenuItem>
                    <DropdownMenuItem class="justify-between" onclick={() => handler.open(entry, TabType.FLOW_GRAPH)}>
                        View flow graph <GitBranchPlus size={16} />
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
        <p class="mb-1 text-2xl font-semibold">Is the file a class file?</p>
        <p class="mb-32 text-sm text-muted-foreground">Failed to read ClassFile structures.</p>
    </div>
{/if}
