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
    import { toJpeg, toPng, toSvg } from "html-to-image";
    import { downloadUrl, prettyMethodDesc } from "$lib/utils";
    import type { Member, Node } from "@katana-project/asm";
    import { CodeXml, Image } from "@lucide/svelte";
    import { checkDims } from "./canvas";
    import { t } from "$lib/i18n";

    interface Props {
        node: Node | null;
        member: Member | null;
        parentElem?: HTMLElement;
    }

    let { node, member, parentElem }: Props = $props();

    let name = $derived.by(() => {
        if (!node) return "Unknown";

        const nodeName = node.thisClass.nameEntry!.string;

        const slashIndex = nodeName.lastIndexOf("/");
        const shortName = slashIndex !== -1 ? nodeName.substring(slashIndex + 1) : nodeName;

        if (member) {
            const signature = member.name.string + prettyMethodDesc(member.type.string);
            return `${shortName}#${signature}`;
        }
        return shortName;
    });

    const flow = $derived(useSvelteFlow());

    const convFuncs = {
        svg: toSvg,
        png: toPng,
        jpeg: toJpeg,
    };

    const baseScale = 4;
    const exportImage = async (type: "svg" | "png" | "jpeg") => {
        const domNode = parentElem?.querySelector<HTMLElement>(".svelte-flow__viewport");
        if (domNode) {
            const bounds = flow.getNodesBounds(flow.getNodes());
            const viewport = getViewportForBounds(bounds, bounds.width, bounds.height, 0, 2.0, { x: "10%", y: "5%" });

            const { width, height } = checkDims(bounds.width * baseScale, bounds.height * baseScale);
            const dataUrl = await convFuncs[type](domNode, {
                skipFonts: true,
                skipAutoScale: true,
                width: bounds.width,
                height: bounds.height,
                // make canvas larger than needed to preserve text legibility
                canvasWidth: width,
                canvasHeight: height,
                style: {
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            });

            downloadUrl(`${name}.${type}`, dataUrl);
        }
    };
</script>

<ContextMenuContent class="min-w-48">
    <ContextMenuLabel>{$t("pane.graph.menu.title")}</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuSub>
        <ContextMenuSubTrigger>{$t("pane.graph.menu.export")}</ContextMenuSubTrigger>
        <ContextMenuSubContent class="min-w-48">
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("svg")}>
                SVG <CodeXml size={16} />
            </ContextMenuItem>
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("png")}>
                PNG <Image size={16} />
            </ContextMenuItem>
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("jpeg")}>
                JPEG <Image size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>
