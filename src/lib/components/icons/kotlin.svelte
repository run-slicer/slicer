<script lang="ts">
    import type { IconProps } from "@lucide/svelte";
    import { cn } from "$lib/components/utils";

    let { size, class: className }: IconProps = $props();
</script>

<!-- https://kotlinlang.org/docs/kotlin-brand-assets.html#kotlin-logo -->
<svg
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    viewBox="0 0 128 128"
    class={cn("lucide lucide-icon", className)}
>
    <defs>
        <linearGradient
            id="a"
            x1="500.003"
            x2="-.097"
            y1="579.106"
            y2="1079.206"
            gradientTransform="translate(15.534 -96.774) scale(.1939)"
            gradientUnits="userSpaceOnUse"
        >
            <stop offset=".003" stop-color="#e44857" />
            <stop offset=".469" stop-color="#c711e1" />
            <stop offset="1" stop-color="#7f52ff" />
        </linearGradient>
    </defs>
    <path fill="url(#a)" d="M112.484 112.484H15.516V15.516h96.968L64 64Zm0 0" />
</svg>
