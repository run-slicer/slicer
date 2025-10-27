# Contributing to slicer

Hey, thank you for your interest in contributing to slicer!
We're a fun project, so we won't hold your contributions to any strict standards,
but we do have some guidelines that will help us keep things organized and make it easier for you to contribute.

1. Before submitting a pull request, please make sure that your code is formatted correctly.
   We use [Prettier](https://prettier.io/) for formatting, so you can run `pnpm format` to format your code.
2. Use CSS variables declared [here](./src/main.css) for colors and other styles (e.g. rounding),
   so that we can easily change the theme later.
3. Prefer arrow functions over regular functions, and use `const` or `let` instead of `var`.
4. Avoid triggering UI actions (e.g. a toast notification) in internal functions, like those in `$lib/workspace`.
   If you need to show a UI response, do it in the component that calls the function or in the generalized UI handler in `$lib/event`.
5. If you plan to implement a major feature, please open an issue/discussion about it first to discuss it.
   This will ensure that we're on the same page and that your work won't be wasted.
6. If you're adding new translation keys, don't manually add them to `/src/locale/index.ts`, that file is auto-generated.
   Instead, just add the keys to `/src/locale/en.json` and run `pnpm types` to update the types.

That's it, have fun contributing! Make sure to check back periodically to see if there were any changes to these guidelines.
