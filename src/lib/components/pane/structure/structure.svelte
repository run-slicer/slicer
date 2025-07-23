<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Search, FileX2 } from "@lucide/svelte";
    import Field from "$lib/components/icons/java/field.svelte";
    import Constructor from "$lib/components/icons/java/constructor.svelte";
    import Method from "$lib/components/icons/java/method.svelte";

    import type { PaneProps } from "..";
    import { EntryType, type ClassEntry } from "$lib/workspace";
    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import AbstractMethod from "$lib/components/icons/java/abstract-method.svelte";
    import {
        getFields,
        getMethods,
        getInnerClasses,
        getModifierIcon,
        getInnerClassIcon,
        getAbstractionInfo,
    } from "./util";
    import StructureMenu from "./menu.svelte";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { prettyJavaType, prettyMethodDesc } from "$lib/utils";

    import { current as currentTab } from "$lib/tab";

    let { handler, classes }: PaneProps = $props();
    let searchQuery = $state("");

    let currentEntry = $derived($currentTab?.entry);

    const packageName = $derived.by(() => {
        const parts = currentEntry?.name.split("/");

        if (!parts) return "";

        return parts.slice(0, parts.length - 1).join("/");
    });

    const node = $derived((currentEntry as ClassEntry)?.node);

    const abstractionInfo = $derived.by(() => getAbstractionInfo(node));
    const fields = $derived.by(() => getFields(node, searchQuery));
    const methods = $derived.by(() => getMethods(currentEntry, node, searchQuery));
    const innerClasses = $derived.by(() => getInnerClasses(node, classes, searchQuery));

    const noResults = $derived.by(() => {
        return methods.length === 0 && fields.length === 0 && innerClasses.length === 0;
    });

    const constructors = $derived(methods.filter((it) => it.constructor));
    const nonConstructors = $derived(methods.filter((it) => !it.constructor));
</script>

<div class="flex h-full w-full flex-col">
    {#if currentEntry && currentEntry.type === EntryType.CLASS}
        {@const { icon: EntryIcon, classes } = entryIcon(currentEntry)}
        <!-- Class info -->
        <div class="bg-muted/20 border-b p-3">
            <div class="mb-2 flex items-center gap-2">
                <EntryIcon class={cn(classes, "h-4 w-4")} />
                <span class="text-sm font-medium">{currentEntry.shortName}</span>
            </div>
            <div class="text-muted-foreground text-xs">
                {#if packageName.trim().length > 0}
                    <div>Package: {packageName}</div>
                {/if}
                {#if abstractionInfo}
                    {#if abstractionInfo.superClass}
                        <div>Extends: {abstractionInfo.superClass}</div>
                    {/if}
                    {#if abstractionInfo.implementations.length > 0}
                        <div>Implements: {abstractionInfo.implementations.join(", ")}</div>
                    {/if}
                {/if}
            </div>
        </div>
        <!-- Search -->
        <div class="border-b p-3">
            <div class="relative">
                <Search class="text-muted-foreground absolute top-2 left-2 h-4 w-4" />
                <Input bind:value={searchQuery} placeholder="Search members..." class="h-8 pl-8" />
            </div>
        </div>

        <!-- Members list -->
        <div class="flex-1 overflow-y-auto">
            <div class="p-2">
                <!-- Fields Section -->
                {#if fields.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium">Fields ({fields.length})</span>
                        </div>
                        {#each fields as field}
                            {@const ModifierIcon = getModifierIcon(field.modifier)}
                            <div
                                class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                            >
                                <div class="flex w-full items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <Field
                                            finalMember={field.isFinal}
                                            staticMember={field.isStatic}
                                            class="size-4"
                                        />

                                        {#if ModifierIcon}
                                            <ModifierIcon class="size-2.5" />
                                        {/if}
                                    </div>

                                    <span class="truncate font-mono text-xs"
                                        >{field.name}: {prettyJavaType(field.type, true)}</span
                                    >
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Constructors Section -->
                {#if constructors.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium"
                                >Constructors ({constructors.length})</span
                            >
                        </div>
                        {#each constructors as constructor}
                            {@const ModifierIcon = getModifierIcon(constructor.modifier)}
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
                            <span class="text-muted-foreground text-sm font-medium"
                                >Methods ({nonConstructors.length})</span
                            >
                        </div>
                        {#each nonConstructors as method}
                            {@const TypeIcon = method.isAbstract ? AbstractMethod : Method}
                            {@const ModifierIcon = getModifierIcon(method.modifier)}
                            {@const signature = method.name + prettyMethodDesc(method.type, true)}

                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <TypeIcon
                                                    finalMember={method.isFinal}
                                                    staticMember={method.isStatic}
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
                {#if innerClasses.length > 0}
                    <div class="mb-4">
                        <div class="mb-2 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-sm font-medium"
                                >Inner Classes ({innerClasses.length})</span
                            >
                        </div>
                        {#each innerClasses as innerClass}
                            {@const TypeIcon = getInnerClassIcon(innerClass)}
                            {@const ModifierIcon = getModifierIcon(innerClass.modifier)}

                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <TypeIcon
                                                    finalMember={innerClass.isFinal &&
                                                        !innerClass.isEnum &&
                                                        !innerClass.isRecord &&
                                                        !innerClass.isAnnotation}
                                                    staticMember={innerClass.isStatic &&
                                                        !innerClass.isEnum &&
                                                        !innerClass.isRecord &&
                                                        !innerClass.isAnnotation}
                                                    class="size-4"
                                                />

                                                {#if ModifierIcon}
                                                    <ModifierIcon class="size-2.5" />
                                                {/if}
                                            </div>

                                            <span class="truncate font-mono text-xs">{innerClass.name}</span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <StructureMenu title={innerClass.name} {handler} entry={innerClass.entry} />
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                {#if noResults}
                    <div class="text-muted-foreground py-8 text-center text-sm">No members found</div>
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
                <h3 class="mb-2 text-lg font-semibold">No Class File Open</h3>
                <p class="text-muted-foreground text-sm">Open a Java class file to view its structure</p>
            </div>
        </div>
    {/if}
</div>
