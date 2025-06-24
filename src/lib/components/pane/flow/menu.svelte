<script lang="ts">
    import {
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
    } from "$lib/components/ui/context-menu";
    import ContextMenuLabel from "$lib/components/menu_label.svelte";
    import { getViewportForBounds, useSvelteFlow } from "@xyflow/svelte";
    import { toPng, toSvg } from "html-to-image";
    import { downloadUrl, prettyMethodDesc } from "$lib/utils";
    import type { Node, Member } from "@run-slicer/asm";
    import type { UTF8Entry } from "@run-slicer/asm/pool";
    import { CodeXml, Image } from "@lucide/svelte";

    interface Props {
        node: Node | null;
        member: Member | null;
        parentElem?: HTMLElement;
    }

    let { node, member, parentElem }: Props = $props();

    let name = $derived.by(() => {
        if (!node) return "Unknown";

        const nodeName = (node.pool[node.thisClass.name] as UTF8Entry).string;

        const slashIndex = nodeName.lastIndexOf("/");
        const shortName = slashIndex !== -1 ? nodeName.substring(slashIndex + 1) : nodeName;

        if (member) {
            const signature = member.name.string + prettyMethodDesc(member.type.string);
            return `${shortName}#${signature}`;
        }
        return shortName;
    });

    const flow = $derived(useSvelteFlow());

    const padding = 128;
    const exportImage = async (type: "svg" | "png") => {
        const bounds = flow.getNodesBounds(flow.getNodes());

        const viewport = getViewportForBounds(bounds, bounds.width + padding, bounds.height + padding, 0, 2.0, 0);
        const domNode = parentElem?.querySelector<HTMLElement>(".svelte-flow__viewport")!;

        if (viewport && domNode) {
            const dataUrl = await (type === "svg" ? toSvg : toPng)(domNode, {
                skipFonts: true,
                width: bounds.width + padding,
                height: bounds.height + padding,
                style: {
                    margin: `-${viewport.y}px -${viewport.x}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            });

            downloadUrl(`${name}.${type}`, dataUrl);
        }
    };
</script>

<ContextMenuContent class="w-48">
    <ContextMenuLabel>Flow chart</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-48">
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("svg")}>
                SVG <CodeXml size={16} />
            </ContextMenuItem>
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("png")}>
                PNG <Image size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>
