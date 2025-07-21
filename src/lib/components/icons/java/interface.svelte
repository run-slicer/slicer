<script lang="ts">
    import { Icon, type IconNode, type IconProps } from "@lucide/svelte";

    let { strokeWidth = 0, ...props }: IconProps = $props();

    const iconNode = [
        [
            "path",
            {
                fill: "#91B859",
                d: "M6,9V4H13V9H23V16H18V21H11V16H1V9H6M16,16H13V19H16V16M8,9H11V6H8V9M6,14V11H3V14H6M18,11V14H21V11H18M13,11V14H16V11H13M8,11V14H11V11H8Z",
            },
        ],
    ] as IconNode;
</script>

<Icon name="record" {...props} strokeWidth={strokeWidth} {iconNode} />