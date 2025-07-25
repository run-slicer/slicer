<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Search, FileX2 } from "@lucide/svelte";
    import { Field, Constructor, Method, AbstractMethod, accessIcon, classIcon } from "$lib/components/icons";
    import type { PaneProps } from "../";
    import { EntryType, type ClassEntry } from "$lib/workspace";
    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import { fields, methods, innerClasses, abstractionInfo } from "./util";
    import StructureMenu from "./menu.svelte";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { partition, prettyJavaType, prettyMethodDesc } from "$lib/utils";
    import { current as currentTab } from "$lib/tab";
    import type { UTF8Entry } from "@run-slicer/asm/pool";

    let { handler, classes }: PaneProps = $props();
    let query = $state("");

    let currentEntry = $derived(
        $currentTab?.entry?.type === EntryType.CLASS ? ($currentTab.entry as ClassEntry) : null
    );
    let currentNode = $derived(currentEntry ? currentEntry.node! : null);

    let [packageName, simpleName] = $derived.by(() => {
        const nameEntry = currentNode?.thisClass;
        if (!nameEntry) {
            return [null, null];
        }

        const parts = (currentNode.pool[nameEntry.name] as UTF8Entry).string.split("/");
        return [parts.slice(0, parts.length - 1).join("."), parts.pop()];
    });

    // TODO: filter over the pretty representation and not the raw descriptors
    let absData = $derived(currentNode ? abstractionInfo(currentNode) : null);
    let fieldData = $derived(currentNode ? fields(currentNode) : []);
    let filteredFieldData = $derived(
        fieldData.filter(
            (member) =>
                member.name.toLowerCase().includes(query.toLowerCase()) ||
                member.type?.toLowerCase().includes(query.toLowerCase())
        )
    );
    let methodData = $derived(currentEntry ? methods(currentEntry) : []);
    let filteredMethodData = $derived(
        methodData.filter(
            (member) =>
                member.name.toLowerCase().includes(query.toLowerCase()) ||
                member.type?.toLowerCase().includes(query.toLowerCase())
        )
    );
    let innerClassData = $derived(currentNode ? innerClasses(currentNode, classes) : []);
    let filteredInnerClassData = $derived(
        innerClassData.filter((cls) => !cls.name || cls.name.toLowerCase().includes(query.toLowerCase()))
    );

    // TODO: filter the partitioned data instead of partitioning the filtered data to have correct counts in the UI
    let [constructors, nonConstructors] = $derived(partition(filteredMethodData, (m) => m.constructor));
</script>

<div class="flex h-full w-full flex-col">
    {#if currentEntry}
        {@const { icon: EntryIcon, classes } = entryIcon(currentEntry)}
        <!-- Class info -->
        <div class="bg-muted/20 border-b p-3">
            <div class="mb-2 flex items-center gap-2">
                <EntryIcon class={cn(classes, "h-4 w-4")} />
                <span class="text-sm font-medium">{simpleName}</span>
            </div>
            <div class="text-muted-foreground text-xs">
                {#if packageName}
                    <div>Package: {packageName}</div>
                {/if}
                {#if absData}
                    {#if absData.superClass}
                        <div>Extends: {absData.superClass}</div>
                    {/if}
                    {#if absData.implementations.length > 0}
                        <div>Implements: {absData.implementations.join(", ")}</div>
                    {/if}
                {/if}
            </div>
        </div>
        <!-- Search -->
        <div class="border-b p-3">
            <div class="relative">
                <Search class="text-muted-foreground absolute top-2 left-2 h-4 w-4" />
                <Input bind:value={query} placeholder="Search members..." class="h-8 pl-8" />
            </div>
        </div>

        <!-- Members list -->
        <div class="flex-1 overflow-y-auto">
            <div class="p-2">
                <!-- Fields Section -->
                {#if filteredFieldData.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium">Fields ({fieldData.length})</span>
                        </div>
                        {#each filteredFieldData as field}
                            {@const ModifierIcon = accessIcon(field.access)}
                            <div
                                class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                            >
                                <div class="flex w-full items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <Field
                                            finalMember={field.access.final}
                                            staticMember={field.access.static}
                                            class="size-4"
                                        />

                                        {#if ModifierIcon}
                                            <ModifierIcon class="size-2.5" />
                                        {/if}
                                    </div>

                                    <span class="truncate font-mono text-xs">
                                        {field.name}: {prettyJavaType(field.type, true)}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Constructors Section -->
                {#if constructors.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium">
                                Constructors ({constructors.length})
                            </span>
                        </div>
                        {#each constructors as constructor}
                            {@const ModifierIcon = accessIcon(constructor.access)}
                            {@const signature = constructor.name + prettyMethodDesc(constructor.type, true)}
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <Constructor class="size-4" />

                                                {#if ModifierIcon}
                                                    <ModifierIcon class="size-2.5" />
                                                {/if}
                                            </div>

                                            <span class="truncate font-mono text-xs">
                                                {signature}
                                            </span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <StructureMenu title={signature} {handler} entry={constructor.entry} />
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                <!-- Methods Section -->
                {#if nonConstructors.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium">
                                Methods ({nonConstructors.length})
                            </span>
                        </div>
                        {#each nonConstructors as method}
                            {@const TypeIcon = method.access.abstract ? AbstractMethod : Method}
                            {@const ModifierIcon = accessIcon(method.access)}
                            {@const signature = method.name + prettyMethodDesc(method.type, true)}

                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <TypeIcon
                                                    finalMember={method.access.final}
                                                    staticMember={method.access.static}
                                                    class="size-4"
                                                />

                                                {#if ModifierIcon}
                                                    <ModifierIcon class="size-2.5" />
                                                {/if}
                                            </div>

                                            <span class="truncate font-mono text-xs">
                                                {signature}
                                            </span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <StructureMenu title={signature} {handler} entry={method.entry} />
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                <!-- Inner Classes Section -->
                {#if filteredInnerClassData.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium">
                                Inner classes ({innerClassData.length})
                            </span>
                        </div>
                        {#each filteredInnerClassData as innerClass}
                            {@const TypeIcon = classIcon(innerClass.access, innerClass.record)}
                            {@const ModifierIcon = accessIcon(innerClass.access)}

                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <TypeIcon
                                                    finalMember={innerClass.access.final}
                                                    staticMember={innerClass.access.static}
                                                    class="size-4"
                                                />

                                                {#if ModifierIcon}
                                                    <ModifierIcon class="size-2.5" />
                                                {/if}
                                            </div>

                                            {#if innerClass.name}
                                                <span class="truncate font-mono text-xs">{innerClass.name}</span>
                                            {:else}
                                                <span class="text-muted-foreground text-xs">(anonymous)</span>
                                            {/if}
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                {#if innerClass.entry}
                                    <StructureMenu
                                        title={innerClass.name ?? "anonymous class"}
                                        {handler}
                                        entry={innerClass.entry}
                                    />
                                {/if}
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                {#if filteredMethodData.length === 0 && filteredFieldData.length === 0 && filteredInnerClassData.length === 0}
                    <div class="text-muted-foreground py-8 text-center text-sm">No members found.</div>
                {/if}
            </div>
        </div>
    {:else}
        <!-- Empty State Content -->
        <div class="flex flex-1 items-center justify-center p-6">
            <div class="flex flex-col items-center justify-center p-8 text-center">
                <!-- Icon -->
                <div class="bg-muted/30 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <FileX2 class="text-muted-foreground h-8 w-8" />
                </div>

                <!-- Title and Subtitle -->
                <h3 class="mb-2 text-lg font-semibold">Nothing to view.</h3>
                <p class="text-muted-foreground text-sm">Open a Java class file to view its structure.</p>
            </div>
        </div>
    {/if}
</div>
