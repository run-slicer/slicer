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
        [
            "path",
            {
                fill: "#82AAFF",
                d: "M23.2 15.6a.79.79 0 0 1-.424.704l-6.32 3.552A.76.76 0 0 1 16 20a.76.76 0 0 1-.456-.144l-6.32-3.552A.79.79 0 0 1 8.8 15.6V8.4c0-.304.168-.568.424-.704l6.32-3.552A.76.76 0 0 1 16 4c.168 0 .328.048.456.144l6.32 3.552c.256.136.424.4.424.704zM16 5.72 11.232 8.4 16 11.08l4.768-2.68z",
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
