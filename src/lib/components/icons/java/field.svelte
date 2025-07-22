<script lang="ts">
    import { Icon, type IconNode } from "@lucide/svelte";
    import { wrapFinal, type JavaIconProps, wrapStatic } from "..";

    let { strokeWidth = 0, finalMember, staticMember, ...props }: JavaIconProps = $props();

    const iconNode = [
        [
            "path",
            {
                fill: "#80CBC4",
                d: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
            },
        ],
    ] as IconNode;

    if (finalMember) {
        wrapFinal(iconNode);
    }

    if (staticMember) {
        wrapStatic(iconNode);
    }
</script>

<Icon name="field" {...props} {strokeWidth} {iconNode} />
