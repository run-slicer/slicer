<script lang="ts" context="module">
    import { createToaster } from "@melt-ui/svelte";

    export interface ToastData {
        title?: string;
        description: string;
        variant?: "default" | "destructive";
    }

    const {
        elements: { content, title, description, close },
        helpers,
        states: { toasts },
        actions: { portal },
    } = createToaster<ToastData>();

    export const addToast = (data: ToastData) => helpers.addToast({ data });
</script>

<script lang="ts">
    import { X } from "lucide-svelte";
    import { flip } from "svelte/animate";
    import { fly } from "svelte/transition";
</script>

<div
    class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 empty:p-0 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    use:portal
>
    {#each $toasts as { id, data } (id)}
        <div
            {...$content(id)}
            use:content
            animate:flip={{ duration: 500 }}
            in:fly={{ duration: 150, x: "100%" }}
            out:fly={{ duration: 150, x: "100%" }}
            class="group pointer-events-auto relative mt-2 flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-6 pr-8 shadow-lg transition-all {data.variant ===
            'destructive'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border bg-background text-foreground'}"
        >
            <div class="grid gap-1">
                {#if data.title}
                    <div {...$title(id)} use:title class="text-sm font-semibold">
                        {data.title}
                    </div>
                {/if}
                <div
                    {...$description(id)}
                    use:description
                    class="overflow-hidden text-ellipsis whitespace-nowrap text-sm opacity-90"
                >
                    {data.description}
                </div>
            </div>
            <button
                {...$close(id)}
                use:close
                class="absolute right-4 top-4 grid place-items-center rounded-full opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 {data.variant ===
                'destructive'
                    ? 'text-red-300 hover:text-red-50'
                    : 'text-foreground/50 hover:text-foreground'} "
                aria-label="Close"
            >
                <X class="h-4 w-4" />
            </button>
        </div>
    {/each}
</div>
