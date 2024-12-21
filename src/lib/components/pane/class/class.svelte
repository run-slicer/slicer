<script lang="ts">
    import type { Tab } from "$lib/tab";
    import type { ClassEntry } from "$lib/workspace";
    import { Tabs, TabsList, TabsContent, TabsTrigger } from "$lib/components/ui/tabs";

    interface Props {
        tab: Tab;
    }

    let { tab }: Props = $props();

    const node = $derived((tab.entry as ClassEntry)?.node);
</script>

<Tabs value="class" class="w-full p-2">
    <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="class">Class</TabsTrigger>
        <TabsTrigger value="fields">Fields</TabsTrigger>
        <TabsTrigger value="methods">Methods</TabsTrigger>
    </TabsList>
    <TabsContent value="class">Class content</TabsContent>
    <TabsContent value="fields">Fields content</TabsContent>
    <TabsContent value="methods">Methods content</TabsContent>
</Tabs>
