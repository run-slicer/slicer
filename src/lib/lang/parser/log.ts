import { LanguageSupport, StreamLanguage, type StreamParser } from "@codemirror/language";

const parser: StreamParser<any> = {
    name: "log",
    token(stream) {
        if (stream.sol()) {
            if (stream.match(/^ {2}/)) {
                stream.skipToEnd();
                return "comment"; // error stack line
            }

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
