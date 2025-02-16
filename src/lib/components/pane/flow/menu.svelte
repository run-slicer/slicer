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
    import { CodeXml, Image } from "lucide-svelte";

    interface Props {
        node: Node | null;
        member: Member | null;
        parentElem?: HTMLElement;
    }

    let { node, member, parentElem }: Props = $props();

    let name = $derived.by(() => {
        if (!node || !member) return "unknown()";

        const nodeName = (node.pool[node.thisClass.name] as UTF8Entry).string;
        const signature = member.name.string + prettyMethodDesc(member.type.string);

        const slashIndex = nodeName.lastIndexOf("/");
        return `${slashIndex !== -1 ? nodeName.substring(slashIndex + 1) : nodeName}#${signature}`;
    });

    const flow = $derived(useSvelteFlow());

    const padding = 128;
    const exportImage = async (type: "svg" | "png") => {
        const bounds = flow.getNodesBounds(flow.getNodes());

        const viewport = getViewportForBounds(bounds, bounds.width + padding, bounds.height + padding, 0, 2.0, 0);
        const domNode = parentElem?.querySelector<HTMLElement>(".svelte-flow__viewport")!;

        if (viewport && domNode) {
            const dataUrl = await (type === "svg" ? toSvg : toPng)(domNode, {
                width: bounds.width + padding,
                height: bounds.height + padding,
                style: {
                    margin: `-${viewport.y}px -${viewport.x}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
                fontEmbedCSS: `/* geist-sans-latin-400-normal */
@font-face {
  font-family: 'Geist Sans';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.woff) format('woff');
}
/* geist-mono-latin-400-normal */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(https://cdn.jsdelivr.net/fontsource/fonts/geist-mono@latest/latin-400-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/geist-mono@latest/latin-400-normal.woff) format('woff');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}`,
            });

            downloadUrl(`${name}.${type}`, dataUrl);
        }
    };
</script>

<ContextMenuContent class="w-[12rem]">
    <ContextMenuLabel>Flow chart</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuSub>
        <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
        <ContextMenuSubContent class="w-[12rem]">
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("svg")}>
                SVG <CodeXml size={16} />
            </ContextMenuItem>
            <ContextMenuItem class="flex justify-between" onclick={() => exportImage("png")}>
                PNG <Image size={16} />
            </ContextMenuItem>
        </ContextMenuSubContent>
    </ContextMenuSub>
</ContextMenuContent>
