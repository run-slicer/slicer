<script lang="ts">
    import { Icon, type IconNode } from "@lucide/svelte";
    import { type JavaIconProps } from "..";

    let { strokeWidth = 0, ...props }: JavaIconProps = $props();

    const iconNode = [
        [
            "path",
            {
                fill: "#F78C6C",
                d: "M3,3H11V7.34L16.66,1.69L22.31,7.34L16.66,13H21V21H13V13H16.66L11,7.34V11H3V3M3,13H11V21H3V13Z",
            },
        ],
    ] as IconNode;
</script>

<Icon name="enum" {...props} {strokeWidth} {iconNode} />
