<script lang="ts">
    import ScriptOption from "./option.svelte";
    import {
        MenubarCheckboxItem,
        MenubarItem,
        MenubarRadioGroup,
        MenubarRadioItem,
        MenubarSub,
        MenubarSubContent,
        MenubarSubTrigger,
    } from "$lib/components/ui/menubar";
    import type { CheckboxOption, GroupOption, Option, RadioOption } from "@run-slicer/script";
    import type { ProtoScript } from "$lib/script";

    interface Props {
        inset?: boolean;
        proto: ProtoScript;
        option: Option;
    }

    let { inset = false, proto, option }: Props = $props();

    const groupOption = $derived(option as GroupOption);

    const handleButton = () => {
        proto.context?.dispatchEvent({ type: "option_change", option });
    };

    const checkboxOption = $derived(option as CheckboxOption);
    const handleCheckbox = (checked: boolean | "indeterminate") => {
        // @ts-ignore
        checkboxOption.checked = Boolean(checked);
        proto.context?.dispatchEvent({ type: "option_change", option });
    };

    const radioOption = $derived(option as RadioOption);
    const handleRadio = (value: string | undefined) => {
        // @ts-ignore
        radioOption.selected = value!;
        proto.context?.dispatchEvent({ type: "option_change", option });
    };
</script>

{#if option.type === "group"}
    {@const hasCheckbox = groupOption.options.some((o) => o.type === "checkbox")}
    <MenubarSub>
        <MenubarSubTrigger {inset}>{option.label || option.id}</MenubarSubTrigger>
        <MenubarSubContent class="w-48">
            {#each groupOption.options as subOption (subOption.id)}
                <ScriptOption inset={hasCheckbox} {proto} option={subOption} />
            {/each}
        </MenubarSubContent>
    </MenubarSub>
{:else if option.type === "button"}
    <MenubarItem {inset} onclick={handleButton}>{option.label || option.id}</MenubarItem>
{:else if option.type === "checkbox"}
    <MenubarCheckboxItem checked={checkboxOption.checked} onCheckedChange={handleCheckbox}>
        {option.label || option.id}
    </MenubarCheckboxItem>
{:else if option.type === "radio"}
    <MenubarSub>
        <MenubarSubTrigger {inset}>{option.label || option.id}</MenubarSubTrigger>
        <MenubarSubContent class="w-48">
            <MenubarRadioGroup value={radioOption.selected} onValueChange={handleRadio}>
                {#each radioOption.items as subOption (subOption.id)}
                    <MenubarRadioItem value={subOption.id}>{subOption.label || subOption.id}</MenubarRadioItem>
                {/each}
            </MenubarRadioGroup>
        </MenubarSubContent>
    </MenubarSub>
{/if}
