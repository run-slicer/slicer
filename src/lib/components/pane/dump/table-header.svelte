<script lang="ts">
    import { ArrowDown, ArrowUp, ArrowUpDown } from "@lucide/svelte";

    interface Props {
        text: string;
        order?: "asc" | "desc";
        onclick: () => void;
    }

    let { text, order, onclick }: Props = $props();

    let OrderIcon = $derived(order ? (order === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown);
</script>

<div class="flex flex-row items-center">
    <span>{text}</span>
    <button
        type="button"
        aria-label="Toggle ordering"
        class="hover:text-accent-foreground ml-2 cursor-pointer"
        {onclick}
    >
        <OrderIcon size={16} />
    </button>
</div>
