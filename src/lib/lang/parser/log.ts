import { LanguageSupport, StreamLanguage, type StreamParser } from "@codemirror/language";

const parser: StreamParser<any> = {
    name: "log",
    token(stream) {
        if (stream.sol()) {
            while (true) {
                stream.next();
                if (stream.peek() === ":") {
                    break;
                }
            }

            return "def"; // level
        }
        if (stream.match(/^: /)) {
            return "comment"; // space
        }

        stream.next();
        return null;
    },
};

export const log = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
