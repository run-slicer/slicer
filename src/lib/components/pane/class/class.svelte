<script lang="ts">
    import type { Tab } from "$lib/tab";
    import type { ClassEntry } from "$lib/workspace";
    import { Tabs, TabsList, TabsContent, TabsTrigger } from "$lib/components/ui/tabs";
    import { FileQuestion } from "lucide-svelte";
    import Pool from "./pool.svelte";
    import Fields from "./fields.svelte";
    import Methods from "./methods.svelte";
    import Overview from "./overview.svelte";
    import type { ActionHandler } from "$lib/action";

    interface Props {
        tab: Tab;
        onaction?: ActionHandler;
    }

    let { tab, onaction }: Props = $props();

    const entry = $derived(tab.entry as ClassEntry | undefined);
    const node = $derived(entry?.node);
</script>

{#if entry && node}
    <Tabs value="overview" class="flex h-full w-full flex-col p-2">
        <TabsList class="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="constant_pool">Constant pool</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="methods">Methods</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
            <Overview {node} />
        </TabsContent>
        <!-- https://github.com/tailwindlabs/tailwindcss/pull/4873#issuecomment-987729814 -->
        <TabsContent value="constant_pool" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Pool {node} />
        </TabsContent>
        <TabsContent value="fields" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Fields {node} />
        </TabsContent>
        <TabsContent value="methods" class="h-full min-h-0 w-full flex-col [&:not([hidden])]:flex">
            <Methods {entry} {onaction} />
        </TabsContent>
    </Tabs>
{:else}
    <div class="flex h-full w-full flex-col items-center justify-center">
        <FileQuestion class="mb-4 animate-bounce text-red-600" size={128} />
        <p class="mb-1 text-2xl font-semibold">Is the file a class file?</p>
        <p class="mb-32 text-sm text-muted-foreground">Failed to read ClassFile structures.</p>
    </div>
{/if}
