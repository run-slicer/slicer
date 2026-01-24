<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Search, LayoutDashboard } from "@lucide/svelte";
    import { Field, Constructor, Method, AbstractMethod, accessIcon, classIcon } from "$lib/components/icons";
    import type { PaneProps } from "../";
    import { EntryType, type ClassEntry } from "$lib/workspace";
    import { entryIcon } from "$lib/components/icons";
    import { cn } from "$lib/components/utils";
    import { fields, methods, innerClasses, abstractionInfo } from "./util";
    import StructureMenu from "./menu.svelte";
    import { ContextMenu, ContextMenuTrigger } from "$lib/components/ui/context-menu";
    import { partition, prettyInternalName } from "$lib/utils";
    import { current as currentTab } from "$lib/tab";
    import { t } from "$lib/i18n";
    import Summary from "./summary.svelte";
    import { Button } from "$lib/components/ui/button";

    let { handler, classes, entries }: PaneProps = $props();

    let showSummary = $state(false);
    let query = $state("");

    let currentEntry = $derived.by(() => {
        const entry = $currentTab?.entry;
        switch (entry?.type) {
            case EntryType.CLASS:
                return entry as ClassEntry;
            case EntryType.MEMBER:
                return entry.parent as ClassEntry;
        }

        return null;
    });
    let currentNode = $derived(currentEntry ? currentEntry.node! : null);

    let [packageName, simpleName] = $derived.by(() => {
        const nameEntry = currentNode?.thisClass?.nameEntry;
        if (!nameEntry) {
            return [null, null];
        }

        const parts = nameEntry.string.split("/");
        return [parts.slice(0, parts.length - 1).join("."), parts.pop()];
    });

    let absData = $derived(currentNode ? abstractionInfo(currentNode) : null);
    let fieldData = $derived(currentNode ? fields(currentNode) : []);
    let filteredFieldData = $derived(
        fieldData.filter((member) => member.signature.toLowerCase().includes(query.toLowerCase()))
    );
    let innerClassData = $derived(currentNode ? innerClasses(currentNode, classes) : []);
    let filteredInnerClassData = $derived(
        innerClassData.filter((cls) => !cls.name || cls.name.toLowerCase().includes(query.toLowerCase()))
    );

    let allMethodData = $derived(currentEntry ? methods(currentEntry) : []);
    let [constructorData, nonConstructors] = $derived(partition(allMethodData, (m) => m.constructor));
    let filteredConstructorData = $derived(
        constructorData.filter((member) => member.signature.toLowerCase().includes(query.toLowerCase()))
    );

    let [initializerData, methodData] = $derived(partition(nonConstructors, (m) => m.initializer));
    let filteredInitializerData = $derived(
        initializerData.filter((member) => member.signature.toLowerCase().includes(query.toLowerCase()))
    );
    let filteredMethodData = $derived(
        methodData.filter((member) => member.signature.toLowerCase().includes(query.toLowerCase()))
    );
</script>

<div class="flex h-full w-full flex-col">
    {#if currentEntry && !showSummary}
        {@const { icon: EntryIcon, classes: iconClasses } = entryIcon(currentEntry)}
        {@const hasSuperData = absData && (absData.superClass || absData.implementations.length > 0)}
        <div class="bg-muted/20 border-b p-3">
            <div class="mb-2 flex w-full justify-between">
                <div class="min-w-0 flex-1">
                    {#if packageName}
                        <div class="text-muted-foreground mb-2 truncate text-xs" title={packageName}>
                            {packageName}
                        </div>
                    {/if}
                    <div class={cn("flex items-center gap-2")}>
                        <EntryIcon class={cn(iconClasses, "h-4 w-4 shrink-0")} />
                        <span class="truncate text-sm font-medium">{prettyInternalName(simpleName || "")}</span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    class="text-muted-foreground ml-2 shrink-0"
                    onclick={() => (showSummary = true)}
                >
                    <LayoutDashboard />
                </Button>
            </div>
            {#if hasSuperData}
                <div class="text-muted-foreground text-xs">
                    {#if absData.superClass}
                        {@const superEntry = classes.get(absData.superClass)}
                        <div>
                            {$t("pane.structure.extends")}
                            <button
                                title={prettyInternalName(absData.superClass)}
                                class={cn("text-secondary-foreground", superEntry ? "cursor-pointer underline" : "")}
                                onclick={() => {
                                    if (superEntry) {
                                        handler.open(superEntry);
                                    }
                                }}
                            >
                                {prettyInternalName(absData.superClass, !!superEntry)}
                            </button>
                        </div>
                    {/if}
                    {#if absData.implementations.length > 0}
                        <div>
                            {$t("pane.structure.implements")}
                            <span class="text-secondary-foreground">
                                {#each absData.implementations as impl, i}
                                    {@const implEntry = classes.get(impl)}
                                    {#if i > 0},
                                    {/if}
                                    <button
                                        title={prettyInternalName(impl)}
                                        class={cn(implEntry && "cursor-pointer underline")}
                                        onclick={() => {
                                            if (implEntry) {
                                                handler.open(implEntry);
                                            }
                                        }}
                                    >
                                        {prettyInternalName(impl, !!implEntry)}
                                    </button>
                                {/each}
                            </span>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
        <div class="border-b p-3">
            <div class="relative">
                <Search class="text-muted-foreground absolute top-2 left-2 h-4 w-4" />
                <Input bind:value={query} placeholder={$t("pane.structure.search.placeholder")} class="h-8 pl-8" />
            </div>
        </div>

        <div class="flex-1 overflow-y-auto">
            <div class="p-2">
                {#if filteredFieldData.length > 0}
                    <div class="mb-3">
                        <div class="mb-1 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-xs font-medium">
                                {$t("pane.structure.fields")}
                            </span>
                            <span class="bg-muted/50 text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                                {fieldData.length}
                            </span>
                        </div>
                        {#each filteredFieldData as field}
                            {@const ModifierIcon = accessIcon(field.access)}
                            <div
                                class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 cursor-pointer items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
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
                                        {field.signature}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if filteredInitializerData.length > 0}
                    <div class="mb-3">
                        <div class="mb-1 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-xs font-medium">
                                {$t("pane.structure.initializers")}
                            </span>
                            <span class="bg-muted/50 text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                                {initializerData.length}
                            </span>
                        </div>
                        {#each filteredInitializerData as initializer}
                            {@const ModifierIcon = accessIcon(initializer.access)}
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 cursor-pointer items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <Constructor class="size-4" />

                                                {#if ModifierIcon}
                                                    <ModifierIcon class="size-2.5" />
                                                {/if}
                                            </div>

                                            <span class="truncate font-mono text-xs">
                                                {initializer.signature}
                                            </span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <StructureMenu title={initializer.signature} {handler} entry={initializer.entry} />
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                {#if filteredConstructorData.length > 0}
                    <div class="mb-3">
                        <div class="mb-1 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-xs font-medium">
                                {$t("pane.structure.constructors")}
                            </span>
                            <span class="bg-muted/50 text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                                {constructorData.length}
                            </span>
                        </div>
                        {#each filteredConstructorData as constructor}
                            {@const ModifierIcon = accessIcon(constructor.access)}
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 cursor-pointer items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
                                    >
                                        <div class="flex w-full items-center gap-2">
                                            <div class="flex items-center gap-1">
                                                <Constructor class="size-4" />

                                                {#if ModifierIcon}
                                                    <ModifierIcon class="size-2.5" />
                                                {/if}
                                            </div>

                                            <span class="truncate font-mono text-xs">
                                                {constructor.signature}
                                            </span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <StructureMenu title={constructor.signature} {handler} entry={constructor.entry} />
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                {#if methodData.length > 0}
                    <div class="mb-3">
                        <div class="mb-1 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-xs font-medium">
                                {$t("pane.structure.methods")}
                            </span>
                            <span class="bg-muted/50 text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                                {methodData.length}
                            </span>
                        </div>
                        {#each methodData as method}
                            {@const TypeIcon = method.access.abstract ? AbstractMethod : Method}
                            {@const ModifierIcon = accessIcon(method.access)}
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class="hover:bg-muted/50 inline-flex h-8 w-full shrink-0 cursor-pointer items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none"
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
                                                {method.signature}
                                            </span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <StructureMenu title={method.signature} {handler} entry={method.entry} />
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                {#if filteredInnerClassData.length > 0}
                    <div class="mb-3">
                        <div class="mb-1 flex items-center gap-2 px-2">
                            <span class="text-muted-foreground text-xs font-medium">
                                {$t("pane.structure.inner-classes")}
                            </span>
                            <span class="bg-muted/50 text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]">
                                {innerClassData.length}
                            </span>
                        </div>
                        {#each filteredInnerClassData as innerClass}
                            {@const TypeIcon = classIcon(innerClass.access, innerClass.record)}
                            {@const ModifierIcon = accessIcon(innerClass.access)}
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <div
                                        class={cn(
                                            "hover:bg-muted/50 inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-all outline-none",
                                            innerClass.entry ? "cursor-pointer" : "cursor-not-allowed"
                                        )}
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
                                                <span class="text-muted-foreground text-xs">
                                                    {$t("pane.structure.inner-classes.anonymous")}
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                {#if innerClass.entry}
                                    <StructureMenu
                                        title={innerClass.name ?? $t("pane.structure.inner-classes.anonymous")}
                                        {handler}
                                        entry={innerClass.entry}
                                    />
                                {/if}
                            </ContextMenu>
                        {/each}
                    </div>
                {/if}

                {#if filteredMethodData.length === 0 && filteredConstructorData.length === 0 && filteredInitializerData.length === 0 && filteredFieldData.length === 0 && filteredInnerClassData.length === 0}
                    <div class="text-muted-foreground py-8 text-center text-sm">
                        {$t("pane.structure.search.no-results")}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <Summary {classes} {entries} bind:currentEntry bind:showSummary />
    {/if}
</div>
