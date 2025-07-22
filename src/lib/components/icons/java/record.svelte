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
    class={cn("lucide lucide-icon lucide-java-record", className)}
>
    <path
        d="M12,14C10.89,14 10,13.1 10,12C10,10.89 10.89,10 12,10C13.11,10 14,10.89 14,12A2,2 0 0,1 12,14M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z"
    />

    {#if finalMember}
        <FinalMark />
    {/if}

    {#if staticMember}
        <StaticMark />
    {/if}
</svg>

<style>
    .lucide-java-record {
        fill: #f9a825;
        stroke-width: 0;
    }
</style>
