import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { kotlin as parser } from "@codemirror/legacy-modes/mode/clike";

export const kotlin = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
