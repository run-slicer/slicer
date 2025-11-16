<script lang="ts">
    import { Alert, AlertTitle } from "$lib/components/ui/alert";
    import { Input } from "$lib/components/ui/input";
    import { CircleAlert } from "@lucide/svelte";
    import { interpHexRowBytes } from "$lib/state";
    import Section from "../section.svelte";
    import Label from "../label.svelte";
    import { t } from "$lib/i18n";
    import { Button } from "$lib/components/ui/button";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Trash2, Plus } from "@lucide/svelte";
    import { toolsDisasmOptions } from "$lib/state";
    import type { PaneProps } from "$lib/components/pane";
    import { Card, CardContent, CardFooter } from "$lib/components/ui/card";
    import { Table, TableBody, TableHead, TableHeader, TableCell, TableRow } from "$lib/components/ui/table";

    let { disasms }: PaneProps = $props();

    let selectedDisasm = $state<string>("");
    let currentOptions = $derived(selectedDisasm ? Object.entries($toolsDisasmOptions[selectedDisasm] ?? {}) : []);

    let newKey = $state("");
    let newValue = $state("");

    const addOption = () => {
        if (!newKey.trim()) {
            return;
        }

        toolsDisasmOptions.update(($opts) => {
            if (!$opts[selectedDisasm]) {
                $opts[selectedDisasm] = {};
            }
            $opts[selectedDisasm][newKey.trim()] = newValue.replaceAll("\\n", "\n");
            return $opts;
        });

        newKey = "";
        newValue = "";
    };

    const removeOption = (key: string) => {
        toolsDisasmOptions.update(($opts) => {
            if ($opts[selectedDisasm]) {
                delete $opts[selectedDisasm][key];
            }
            return $opts;
        });
    };
</script>

<Section id="interp" labelKey="pane.prefs.section.interp">
    <Alert variant="destructive" class="w-full">
        <CircleAlert />
        <AlertTitle>{$t("pane.prefs.workspace.interp.alert")}</AlertTitle>
    </Alert>
    <div class="grid min-h-[2.5rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
        <Label
            for="bytesPerRow"
            textKey="pane.prefs.workspace.interp.bytes-per-row"
            descKey="pane.prefs.workspace.interp.bytes-per-row.desc"
        />
        <Input id="bytesPerRow" type="number" bind:value={$interpHexRowBytes} class="w-48" />
    </div>

    <Section id="disasm" labelKey="pane.prefs.section.disasm" small>
        <div class="grid min-h-[2.5rem] grid-cols-[minmax(auto,1fr)_auto] items-center gap-4">
            <Label for="disasmSelect" textKey="pane.prefs.disasm.options" descKey="pane.prefs.disasm.options.desc" />
            <Select type="single" bind:value={selectedDisasm}>
                <SelectTrigger id="disasmSelect" class="w-48">
                    {@const disasm = disasms.find((d) => d.id === selectedDisasm)}
                    <span>{disasm?.name || selectedDisasm || $t("pane.prefs.disasm.options.placeholder")}</span>
                </SelectTrigger>
                <SelectContent side="top">
                    {#each disasms as dism (dism.id)}
                        <SelectItem value={dism.id} label={dism.id} class="justify-between text-xs tracking-tight">
                            <span>{dism.name || dism.id}</span>
                            {#if dism.version}<span class="text-muted-foreground">{dism.version}</span>{/if}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>

        {#if selectedDisasm}
            <Card
                class="w-full"
                {@attach (e) => {
                    selectedDisasm; // update on change
                    e.scrollIntoView({ behavior: "smooth" });
                }}
            >
                <CardContent>
                    {#if currentOptions.length > 0}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{$t("pane.prefs.disasm.options.key")}</TableHead>
                                    <TableHead>{$t("pane.prefs.disasm.options.value")}</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each currentOptions as [key, value] (key)}
                                    <TableRow>
                                        <TableCell class="font-mono tracking-tight">{key}</TableCell>
                                        <TableCell class="break-anywhere font-mono tracking-tight whitespace-normal">
                                            {value.replaceAll("\n", "\\n")}
                                        </TableCell>
                                        <TableCell>
                                            <div class="inline-flex w-full justify-end">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onclick={() => removeOption(key)}
                                                    title={$t("pane.prefs.disasm.options.remove")}
                                                >
                                                    <Trash2 class="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            </TableBody>
                        </Table>
                    {:else}
                        <p class="text-muted-foreground text-sm">{$t("pane.prefs.disasm.options.none")}</p>
                    {/if}
                </CardContent>
                <div class="bg-border h-px"></div>
                <CardFooter>
                    <div class="grid w-full grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <Input type="text" bind:value={newKey} placeholder={$t("pane.prefs.disasm.options.key")} />
                        <Input type="text" bind:value={newValue} placeholder={$t("pane.prefs.disasm.options.value")} />
                        <Button
                            size="icon"
                            onclick={addOption}
                            disabled={!newKey.trim()}
                            title={$t("pane.prefs.disasm.options.add")}
                        >
                            <Plus class="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        {/if}
    </Section>
</Section>
