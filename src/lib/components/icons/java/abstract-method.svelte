<script lang="ts">
    import { Icon, type IconNode } from "@lucide/svelte";
    import { wrapFinal, wrapStatic, type JavaIconProps } from "..";

    let { strokeWidth = 0, finalMember, staticMember, ...props }: JavaIconProps = $props();

    const iconNode = [
        [
            "path",
            {
                fill: "#82AAFF",
                d: "M16 4 9 8.04v7.92L16 20l7-4.04V8.04m-7-1.73 3.8 2.19-3.8 2.19-3.79-2.19M0 7v2h7V7m4 3.11 4 2.31v4.69l-4-2.3m10-4.7v4.7l-4 2.3v-4.69M2 11v2h5v-2m-3 4v2h3v-2",
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

<Icon name="method" {...props} {strokeWidth} {iconNode} />
