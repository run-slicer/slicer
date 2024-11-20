<script lang="ts">
    import { cn } from "$lib/components/utils";

    interface Props {
        text: string;
        mono?: boolean;
    }

    let { text, mono }: Props = $props();
</script>

<span class={cn(!mono || "font-mono tracking-tight")}>{text}</span>
