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
    class={cn("lucide lucide-icon lucide-java-method", className)}
>
    <path
        d="M16 4 9 8.04v7.92L16 20l7-4.04V8.04m-7-1.73 3.8 2.19-3.8 2.19-3.79-2.19M0 7v2h7V7m4 3.11 4 2.31v4.69l-4-2.3m10-4.7v4.7l-4 2.3v-4.69M2 11v2h5v-2m-3 4v2h3v-2"
    />

    <path
        d="M23.2 15.6a.79.79 0 0 1-.424.704l-6.32 3.552A.76.76 0 0 1 16 20a.76.76 0 0 1-.456-.144l-6.32-3.552A.79.79 0 0 1 8.8 15.6V8.4c0-.304.168-.568.424-.704l6.32-3.552A.76.76 0 0 1 16 4c.168 0 .328.048.456.144l6.32 3.552c.256.136.424.4.424.704zM16 5.72 11.232 8.4 16 11.08l4.768-2.68z"
    />

    {#if finalMember}
        <FinalMark />
    {/if}

    {#if staticMember}
        <StaticMark />
    {/if}
</svg>

<style>
    .lucide-java-method {
        fill: #82aaff;
        stroke-width: 0;
    }
</style>
