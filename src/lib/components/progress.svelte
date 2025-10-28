<!-- modification: indeterminate state (https://github.com/shadcn-ui/ui/issues/700#issuecomment-2221528928) -->
<script lang="ts">
    import { Progress as ProgressPrimitive, type WithoutChildrenOrChild } from "bits-ui";
    import { cn } from "$lib/components/utils";

    interface Props {
        indeterminate?: boolean;
    }

    let {
        ref = $bindable(null),
        class: className,
        max = 100,
        value,
        indeterminate = false,
        ...restProps
    }: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & Props = $props();
</script>

<ProgressPrimitive.Root
    bind:ref
    data-slot="progress"
    class={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
    {value}
    {max}
    {...restProps}
>
    <div
        data-slot="progress-indicator"
        class={cn("bg-primary h-full w-full flex-1 transition-all", indeterminate && "animate-progress origin-left")}
        style={`transform: translateX(-${100 - (100 * (value ?? 0)) / (max ?? 1)}%)`}
    ></div>
</ProgressPrimitive.Root>
