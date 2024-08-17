<script lang="ts">
    import {
        MenubarItem,
        MenubarCheckboxItem,
        MenubarSub,
        MenubarSubContent,
        MenubarSubTrigger,
        MenubarRadioItem,
        MenubarRadioGroup,
    } from "$lib/components/ui/menubar";
    import type { CheckboxOption, GroupOption, Option, RadioOption } from "@run-slicer/script";
    import type { ProtoScript } from "$lib/script";

    export let proto: ProtoScript;
    export let option: Option;

    const groupOption = option as GroupOption;

    const handleButton = () => {
        proto.context?.dispatchEvent({ type: "option_change", option });
    };

    const checkboxOption = option as CheckboxOption;
    const handleCheckbox = (checked: boolean | "indeterminate") => {
        checkboxOption.checked = Boolean(checked);
        proto.context?.dispatchEvent({ type: "option_change", option });
    };

    const radioOption = option as RadioOption;
    const handleRadio = (value: string | undefined) => {
        radioOption.selected = value!;
        proto.context?.dispatchEvent({ type: "option_change", option });
    };
</script>

{#if option.type === "group"}
    <MenubarSub>
        <MenubarSubTrigger>{option.label || option.id}</MenubarSubTrigger>
        <MenubarSubContent class="w-[12rem]">
            {#each groupOption.options as subOption (subOption.id)}
                <svelte:self {proto} option={subOption} />
            {/each}
        </MenubarSubContent>
    </MenubarSub>
{:else if option.type === "button"}
    <MenubarItem on:click={handleButton}>{option.label || option.id}</MenubarItem>
{:else if option.type === "checkbox"}
    <MenubarCheckboxItem checked={checkboxOption.checked} onCheckedChange={handleCheckbox}>
        {option.label || option.id}
    </MenubarCheckboxItem>
{:else if option.type === "radio"}
    <MenubarSub>
        <MenubarSubTrigger>{option.label || option.id}</MenubarSubTrigger>
        <MenubarSubContent class="w-[12rem]">
            <MenubarRadioGroup value={radioOption.selected} onValueChange={handleRadio}>
                {#each radioOption.items as subOption (subOption.id)}
                    <MenubarRadioItem value={subOption.id}>{subOption.label || subOption.id}</MenubarRadioItem>
                {/each}
            </MenubarRadioGroup>
        </MenubarSubContent>
    </MenubarSub>
{/if}
