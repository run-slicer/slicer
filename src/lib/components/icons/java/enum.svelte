<script lang="ts">
    import { type JavaIconProps } from "..";
    import { cn } from "$lib/components/utils";
    import FinalMark from "./mark/final-mark.svelte";
    import StaticMark from "./mark/static-mark.svelte";

    let { size, finalMember, staticMember, class: className }: JavaIconProps = $props();
</script>

<svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    class={cn("lucide lucide-icon lucide-java-enum", className)}
>
    <path d="M3,3H11V7.34L16.66,1.69L22.31,7.34L16.66,13H21V21H13V13H16.66L11,7.34V11H3V3M3,13H11V21H3V13Z" />

    {#if finalMember}
        <FinalMark />
    {/if}

    {#if staticMember}
        <StaticMark />
    {/if}
</svg>

<style>
    .lucide-java-enum {
        fill: #f78c6c;
        stroke-width: 0;
    }
</style>
