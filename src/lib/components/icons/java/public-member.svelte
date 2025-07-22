<script lang="ts">
    import { Icon, type IconNode, type IconProps } from "@lucide/svelte";

    let { strokeWidth = 0, ...props }: IconProps = $props();

    const iconNode = [
        [
            "path",
            {
                fill: "#aed581",
                d: "M18.165.23a5.606 5.606 0 0 0-5.605 5.605v2.242H2.473A2.24 2.24 0 0 0 .23 10.319v11.208a2.24 2.24 0 0 0 2.242 2.242h13.45a2.234 2.234 0 0 0 2.242-2.242V10.32a2.24 2.24 0 0 0-2.242-2.242h-1.12V5.835a3.36 3.36 0 0 1 3.362-3.362 3.36 3.36 0 0 1 3.362 3.362v2.242h2.242V5.835A5.606 5.606 0 0 0 18.165.231M9.198 13.68a2.24 2.24 0 0 1 2.242 2.242 2.234 2.234 0 0 1-2.242 2.242 2.242 2.242 0 1 1 0-4.484",
            },
        ],
    ] as IconNode;
</script>

<Icon name="public-member" {...props} {strokeWidth} {iconNode} />
