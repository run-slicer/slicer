<script lang="ts">
    import { Icon, type IconNode, type IconProps } from "@lucide/svelte";

    let { strokeWidth = 0, ...props }: IconProps = $props();

    const iconNode = [
        [
            "path",
            {
                fill: "#e57373",
                d: "M12 18.274a2.28 2.28 0 0 0 2.281-2.282A2.28 2.28 0 0 0 12 13.711a2.28 2.28 0 0 0-2.281 2.281A2.28 2.28 0 0 0 12 18.274m6.844-10.266a2.28 2.28 0 0 1 2.281 2.281v11.407a2.28 2.28 0 0 1-2.281 2.28H5.156a2.28 2.28 0 0 1-2.281-2.28V10.289a2.28 2.28 0 0 1 2.281-2.281h1.14V5.726A5.703 5.703 0 0 1 12 .023a5.703 5.703 0 0 1 5.703 5.703v2.282ZM12 2.304a3.42 3.42 0 0 0-3.422 3.422v2.282h6.844V5.726A3.42 3.42 0 0 0 12 2.304",
            },
        ],
    ] as IconNode;
</script>

<Icon name="private-member" {...props} {strokeWidth} {iconNode} />
