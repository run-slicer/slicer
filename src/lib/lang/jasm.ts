import { type StreamParser, StreamLanguage, LanguageSupport } from "@codemirror/language";

// TODO: make a lezer parser for folding
const parser: StreamParser<any> = {
    name: "jasm",
    token(stream) {
        if (stream.sol()) {
            if (stream.match(/^\s*\.([a-zA-Z]+)/)) {
                return "keyword";
            }
            if (stream.match(/^\s*[^\s:]+?:/)) {
                return "def";
            }
        }

        switch (stream.next()) {
            case "{":
            case "}":
                return "brace";
        }

        return null;
    },
};

export const jasm = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
