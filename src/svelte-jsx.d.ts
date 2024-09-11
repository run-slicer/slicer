// https://github.com/baseballyama/svelte-preprocess-delegate-events
declare namespace svelteHTML {
    /**
     * base: https://github.com/sveltejs/language-tools/blob/651db67858d18ace44d000d263ac57ed5590ea05/packages/svelte2tsx/svelte-jsx.d.ts#L42
     */
    type HTMLProps<Property extends string, Override> = Omit<
        Omit<
            import("svelte/elements").SvelteHTMLElements[Property],
            keyof EventsWithColon<Omit<svelte.JSX.IntrinsicElements[Property & string], svelte.JSX.AttributeNames>>
        > &
            EventsWithColon<Omit<svelte.JSX.IntrinsicElements[Property & string], svelte.JSX.AttributeNames>>,
        keyof Override
    > &
        Override &
        (Record<"on:*", (event: Event & { currentTarget: EventTarget & EventTarget }) => any | never> | object);
}
