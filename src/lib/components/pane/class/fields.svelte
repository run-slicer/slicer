<script lang="ts">
    import type { Node } from "@katana-project/asm";
    import { ElementType, formatMod, escapeLiteral } from "@katana-project/asm/analysis/disasm";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
    import { t } from "$lib/i18n";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();
</script>

<Table>
    <TableHeader class="bg-background sticky top-0 z-10 shadow-lg">
        <TableRow>
            <TableHead>{$t("pane.class.fields.index")}</TableHead>
            <TableHead>{$t("pane.class.fields.modifiers")}</TableHead>
            <TableHead>{$t("pane.class.fields.type")}</TableHead>
            <TableHead>{$t("pane.class.fields.name")}</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {#if node.fields.length > 0}
            {#each node.fields as field, i (i)}
                {@const mods = formatMod(field.access, ElementType.FIELD)}
                <TableRow>
                    <TableCell class="font-medium">{i}</TableCell>
                    <TableCell>
                        <span class="break-anywhere font-mono tracking-tight">
                            {mods || $t("pane.class.fields.none")}
                        </span>
                        ({field.access})
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                        {field.type.string}
                    </TableCell>
                    <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                        {escapeLiteral(field.name.string)}
                    </TableCell>
                </TableRow>
            {/each}
        {:else}
            <TableRow>
                <TableCell colspan={4} class="h-24 text-center">{$t("pane.class.fields.no-fields")}</TableCell>
            </TableRow>
        {/if}
    </TableBody>
</Table>
