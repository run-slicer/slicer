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
    class={cn("lucide lucide-icon lucide-java-public-member", className)}
>
    <path
        d="M18.165.23a5.606 5.606 0 0 0-5.605 5.605v2.242H2.473A2.24 2.24 0 0 0 .23 10.319v11.208a2.24 2.24 0 0 0 2.242 2.242h13.45a2.234 2.234 0 0 0 2.242-2.242V10.32a2.24 2.24 0 0 0-2.242-2.242h-1.12V5.835a3.36 3.36 0 0 1 3.362-3.362 3.36 3.36 0 0 1 3.362 3.362v2.242h2.242V5.835A5.606 5.606 0 0 0 18.165.231M9.198 13.68a2.24 2.24 0 0 1 2.242 2.242 2.234 2.234 0 0 1-2.242 2.242 2.242 2.242 0 1 1 0-4.484"
    />
</svg>

<style>
    .lucide-java-public-member {
        fill: #aed581;
        stroke-width: 0;
    }
</style>
