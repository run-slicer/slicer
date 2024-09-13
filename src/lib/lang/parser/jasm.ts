import { type StreamParser, StreamLanguage, LanguageSupport } from "@codemirror/language";

interface State {
    braces: boolean[]; // marks whether a block contains a label
}

const parser: StreamParser<State> = {
    name: "jasm",
    token(stream, state) {
        // numbers, needs to be before we eat space
        if (stream.match(/^\s+[0-9-]/, false)) {
            stream.eatSpace();

            // this madness is from JASM itself, jesus
            if (
                stream.match(
                    /^-?(?:(?:\d[\d_]*\.(?:\d[\d_]*)?([eE]-?\d[\d_]*)?|\.\d[\d_]*(?:[eE]-?\d[\d_]*)?|\d[\d_]*[eE]-?\d[\d_]*|0[xX][\dA-Fa-f_]*(\.[\dA-Fa-f_]*)?[pP]-?\d[\d_]*)[fFdD]?|(?:0[xX][\dA-fa-f_]+|\d[\d_]*)[LlFfDd]?)/
                )
            ) {
                return "number";
            }
        }

        if (stream.eatSpace()) {
            return null;
        }

        // comments
        if (stream.match("//")) {
            stream.skipToEnd();
            return "comment";
        }

        const braceIndex = state.braces.length - 1;

        // identifiers
        if (!state.braces[braceIndex] && stream.match(/^\.([^"'{},:\s]+)/)) {
            stream.eatSpace();

            // include any following modifiers as well
            stream.match(
                /(?:(?:public|private|protected|static|final|abstract|strictfp|transient|volatile|synchronized|native|varargs|bridge|synthetic|enum|annotation|module|super|interface|record|sealed|open|non-sealed)\s+)+/
            );
            return "keyword";
        }
        // labels
        if (stream.match(/^([^"'{},:\s]+):/)) {
            if (braceIndex >= 0) {
                state.braces[braceIndex] = true;
            }

            return "variable";
        }

        // special numbers
        if (stream.match(/^-?(?:nan|infinity)/)) {
            return "number";
        }

        // https://gist.github.com/cellularmitosis/6fd5fc2a65225364f72d3574abd9d5d5

        // strings
        if (stream.match(/^"(?:[^"\\]|\\[\s\S])*"/)) {
            return "string";
        }
        // characters
        if (stream.match(/^'(?:[^'\\]|\\[\s\S])*'/)) {
            return "string";
        }

        switch (stream.next()) {
            case "{":
                state.braces.push(Boolean(state.braces[braceIndex]) /* propagate state */);
                return "brace";
            case "}":
                state.braces.pop();
                return "brace";
            case "(":
            case ")":
                return "paren";
            case ",":
            case ":":
                return "punctuation";
        }

        return null;
    },
    startState() {
        return {
            braces: [],
        };
    },
};

export const jasm = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
