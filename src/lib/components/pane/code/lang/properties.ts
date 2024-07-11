import { LanguageSupport, StreamLanguage, type StreamParser } from "@codemirror/language";

interface State {
    position: string;
    nextMultiline: boolean;
    inMultiline: boolean;
    afterSection: boolean;
}

const parser: StreamParser<State> = {
    name: "properties",
    token: (stream, state) => {
        const sol = stream.sol() || state.afterSection;
        const eol = stream.eol();

        state.afterSection = false;

        if (sol) {
            if (state.nextMultiline) {
                state.inMultiline = true;
                state.nextMultiline = false;
            } else {
                state.position = "def";
            }
        }

        if (eol && !state.nextMultiline) {
            state.inMultiline = false;
            state.position = "def";
        }

        if (sol) {
            while (stream.eatSpace()) {}
        }

        const c = stream.next();
        if (sol && (c === "#" || c === "!" || c === ";")) {
            state.position = "comment";
            stream.skipToEnd();
        } else if (sol && c === "[") {
            state.afterSection = true;
            stream.skipTo("]");
            stream.eat("]");
            return "header";
        } else if (c === "=" || c === ":") {
            state.position = "quote";
            return null;
        } else if (c === "\\" && state.position === "quote") {
            if (stream.eol()) {
                state.nextMultiline = true;
            }
        }

        return state.position;
    },
    startState: () => ({
        position: "def",
        nextMultiline: false,
        inMultiline: false,
        afterSection: false,
    }),
};

export const properties = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
