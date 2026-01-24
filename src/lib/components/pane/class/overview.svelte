<script lang="ts" module>
    export const specialVer: Record<number, string> = {
        45: "1.0.2 or 1.1",
        46: "1.2",
        47: "1.3",
        48: "1.4",
    };
</script>

<script lang="ts">
    import type { Node } from "@katana-project/asm";
    import { Table, TableCell, TableHead, TableRow } from "$lib/components/ui/table";
    import { ElementType, formatMod } from "@katana-project/asm/analysis/disasm";
    import { AttributeType, Modifier } from "@katana-project/asm/spec";
    import type {
        PermittedSubclassesAttribute,
        SignatureAttribute,
        SourceFileAttribute,
    } from "@katana-project/asm/attr";
    import { t } from "$lib/i18n";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();

    const permittedSubclassesAttr = node.attrs.find((a) => a.type === AttributeType.PERMITTED_SUBCLASSES);
    const signatureAttr = node.attrs.find((a) => a.type === AttributeType.SIGNATURE);
    const sourceFileAttr = node.attrs.find((a) => a.type === AttributeType.SOURCE_FILE);

    const name = node.thisClass.nameEntry!.string;
    const mods = formatMod(
        node.access,
        (node.access & Modifier.INTERFACE) !== 0 ? ElementType.INTERFACE : ElementType.CLASS
    );
    const superName = node.superClass ? node.superClass.nameEntry!.string : null;
    const interfaces = node.interfaces.map(({ nameEntry }) => nameEntry!.string);

    const permittedSubclasses =
        (permittedSubclassesAttr as PermittedSubclassesAttribute)?.classes?.map(
            ({ entry }) => entry?.nameEntry?.string
        ) || [];
    const signature = (signatureAttr as SignatureAttribute)?.signatureEntry?.string;
    const sourceFile = (sourceFileAttr as SourceFileAttribute)?.sourceFileEntry?.string;
</script>

<Table>
    <TableRow>
        <TableHead>{$t("pane.class.overview.magic")}</TableHead>
        <TableCell>
            <span class="font-mono tracking-tight">
                0x{node.magic.toString(16)}
            </span>
            ({node.magic})
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>{$t("pane.class.overview.version.minor")}</TableHead>
        <TableCell>
            <span class="font-mono tracking-tight">
                {node.minor}
            </span>
            {#if node.major >= 55}
                ({$t(
                    `pane.class.overview.version.minor.preview.${node.minor === 65535 ? "enabled" : node.minor === 0 ? "disabled" : "unknown"}`
                )})
            {/if}
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>{$t("pane.class.overview.version.major")}</TableHead>
        <TableCell>
            <span class="font-mono tracking-tight">
                {node.major}
            </span>
            ({specialVer[node.major] || (node.major - 44).toString()})
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>{$t("pane.class.overview.name")}</TableHead>
        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">{name}</TableCell>
    </TableRow>
    <TableRow>
        <TableHead>{$t("pane.class.overview.modifiers")}</TableHead>
        <TableCell>
            <span class="break-anywhere font-mono tracking-tight">
                {mods || $t("pane.class.overview.none")}
            </span>
            ({node.access})
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>{$t("pane.class.overview.super")}</TableHead>
        <TableCell class="break-anywhere font-mono tracking-tight"
            >{superName || $t("pane.class.overview.none")}</TableCell
        >
    </TableRow>
    <TableRow>
        <TableHead>{$t("pane.class.overview.interfaces")}</TableHead>
        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
            {#if interfaces.length > 0}
                {#each interfaces as iff, i}
                    {iff}
                    {#if i !== interfaces.length - 1}<br />{/if}
                {/each}
            {:else}
                {$t("pane.class.overview.none")}
            {/if}
        </TableCell>
    </TableRow>
    {#if permittedSubclasses.length > 0}
        <TableRow>
            <TableHead>{$t("pane.class.overview.permitted-subclasses")}</TableHead>
            <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                {#each permittedSubclasses as subclass, i}
                    {subclass}
                    {#if i !== permittedSubclasses.length - 1}<br />{/if}
                {/each}
            </TableCell>
        </TableRow>
    {/if}
    {#if signature}
        <TableRow>
            <TableHead>{$t("pane.class.overview.signature")}</TableHead>
            <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">{signature}</TableCell>
        </TableRow>
    {/if}
    {#if sourceFile}
        <TableRow>
            <TableHead>{$t("pane.class.overview.source-file")}</TableHead>
            <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">{sourceFile}</TableCell>
        </TableRow>
    {/if}
</Table>
