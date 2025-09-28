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
    import type { UTF8Entry } from "@katana-project/asm/pool";
    import { Table, TableCell, TableHead, TableRow } from "$lib/components/ui/table";
    import { ElementType, formatMod } from "@katana-project/asm/analysis/disasm";
    import { AttributeType, Modifier } from "@katana-project/asm/spec";
    import type {
        PermittedSubclassesAttribute,
        SignatureAttribute,
        SourceFileAttribute,
    } from "@katana-project/asm/attr";

    interface Props {
        node: Node;
    }

    let { node }: Props = $props();

    const permittedSubclassesAttr = node.attrs.find((a) => a.type === AttributeType.PERMITTED_SUBCLASSES);
    const signatureAttr = node.attrs.find((a) => a.type === AttributeType.SIGNATURE);
    const sourceFileAttr = node.attrs.find((a) => a.type === AttributeType.SOURCE_FILE);

    const name = (node.pool[node.thisClass.name] as UTF8Entry).string;
    const mods = formatMod(
        node.access,
        (node.access & Modifier.INTERFACE) !== 0 ? ElementType.INTERFACE : ElementType.CLASS
    );
    const superName = node.superClass ? (node.pool[node.superClass.name] as UTF8Entry).string : null;
    const interfaces = node.interfaces.map(({ name }) => (node.pool[name] as UTF8Entry).string);

    const permittedSubclasses =
        (permittedSubclassesAttr as PermittedSubclassesAttribute)?.classes?.map(
            ({ entry }) => (node.pool[entry?.name ?? 0] as UTF8Entry).string
        ) || [];
    const signature = (signatureAttr as SignatureAttribute)?.signatureEntry?.string;
    const sourceFile = (sourceFileAttr as SourceFileAttribute)?.sourceFileEntry?.string;
</script>

<Table>
    <TableRow>
        <TableHead>Magic</TableHead>
        <TableCell>
            <span class="font-mono tracking-tight">
                0x{node.magic.toString(16)}
            </span>
            ({node.magic})
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>Minor version</TableHead>
        <TableCell>
            <span class="font-mono tracking-tight">
                {node.minor}
            </span>
            {#if node.major >= 55}
                (preview features {node.minor === 65535 ? "enabled" : node.minor === 0 ? "disabled" : "unknown"})
            {/if}
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>Major version</TableHead>
        <TableCell>
            <span class="font-mono tracking-tight">
                {node.major}
            </span>
            ({specialVer[node.major] || (node.major - 44).toString()})
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>Name</TableHead>
        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">{name}</TableCell>
    </TableRow>
    <TableRow>
        <TableHead>Modifiers</TableHead>
        <TableCell>
            <span class="break-anywhere font-mono tracking-tight">
                {mods || "<none>"}
            </span>
            ({node.access})
        </TableCell>
    </TableRow>
    <TableRow>
        <TableHead>Super</TableHead>
        <TableCell class="break-anywhere font-mono tracking-tight">{superName || "<none>"}</TableCell>
    </TableRow>
    <TableRow>
        <TableHead>Interfaces</TableHead>
        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
            {#if interfaces.length > 0}
                {#each interfaces as iff, i}
                    {iff}
                    {#if i !== interfaces.length - 1}<br />{/if}
                {/each}
            {:else}
                {"<none>"}
            {/if}
        </TableCell>
    </TableRow>
    {#if permittedSubclasses.length > 0}
        <TableRow>
            <TableHead>Permitted subclasses</TableHead>
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
            <TableHead>Signature</TableHead>
            <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">{signature}</TableCell>
        </TableRow>
    {/if}
    {#if sourceFile}
        <TableRow>
            <TableHead>Source file</TableHead>
            <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">{sourceFile}</TableCell>
        </TableRow>
    {/if}
</Table>
