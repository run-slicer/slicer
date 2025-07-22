<script lang="ts">
    import { type IconProps } from "@lucide/svelte";
    import { cn } from "$lib/components/utils";

    let { size, class: className }: IconProps = $props();
</script>

<svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    class={cn("lucide lucide-icon lucide-java-protected-member", className)}
>
    <path
        d="M12 18.257a2.275 2.275 0 0 1-2.275-2.275A2.267 2.267 0 0 1 12 13.706a2.275 2.275 0 0 1 2.275 2.276A2.275 2.275 0 0 1 12 18.257m6.826 3.413V10.294H5.174V21.67zm0-13.652a2.275 2.275 0 0 1 2.275 2.276V21.67a2.275 2.275 0 0 1-2.275 2.275H5.174A2.275 2.275 0 0 1 2.9 21.67V10.294a2.267 2.267 0 0 1 2.275-2.276h1.138V5.743A5.69 5.69 0 0 1 12 .055a5.69 5.69 0 0 1 5.688 5.688v2.275ZM12 2.33a3.413 3.413 0 0 0-3.413 3.413v2.275h6.826V5.743A3.413 3.413 0 0 0 12 2.33"
    />
</svg>

<style>
    .lucide-java-protected-member {
        fill: #ffc107;
        stroke-width: 0;
    }
</style>
