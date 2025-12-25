<script lang="ts">
    import type { Node } from "@katana-project/asm";
    import { AttributeType, ConstantType } from "@katana-project/asm/spec";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import { formatEntry } from "@katana-project/asm/analysis/disasm";
    import { t } from "$lib/i18n";
    import type { BootstrapMethodsAttribute } from "@katana-project/asm/attr";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();
    let bsmAttr = $derived(
        node.attrs.find((e) => e?.type === AttributeType.BOOTSTRAP_METHODS) as BootstrapMethodsAttribute | undefined
    );
</script>

<Table>
    <TableHeader class="bg-background sticky top-0 z-10 shadow-lg">
        <TableRow>
            <TableHead>{$t("pane.class.pool.index")}</TableHead>
            <TableHead>{$t("pane.class.pool.type")}</TableHead>
            <TableHead>{$t("pane.class.pool.value")}</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#if node.pool.length > 0}
            {#each node.pool as entry, i (i)}
                {#if entry}
                    <TableRow>
                        <TableCell class="font-medium">{i}</TableCell>
                        <TableCell>
                            <span class="font-mono tracking-tight">
                                {ConstantType[entry.type] || $t("pane.class.pool.unknown")}
                            </span>
                            ({entry.type})
                        </TableCell>
                        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                            {formatEntry(entry, node.pool, bsmAttr)}
                        </TableCell>
                    </TableRow>
                {/if}
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={3} class="h-24 text-center">{$t("pane.class.pool.no-entries")}</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
