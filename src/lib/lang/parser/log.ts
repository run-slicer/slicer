import { LanguageSupport, StreamLanguage, type StreamParser } from "@codemirror/language";
import { Tag } from "@lezer/highlight";

export const logInfo = Tag.define("log-info");
export const logWarn = Tag.define("log-warn");
export const logError = Tag.define("log-error");

const parser: StreamParser<any> = {
    name: "log",
    token(stream) {
        if (stream.sol()) {
            if (stream.match(/^ {2}/)) {
                stream.skipToEnd();
                return "comment"; // error stack line
            }
            if (stream.match(/^warn(?=: )/)) {
                return "log-warn"; // warning level
            }
            if (stream.match(/^error(?=: )/)) {
                return "log-error"; // error level
            }

            while (true) {
                stream.next();
                if (stream.peek() === ":") {
                    break;
                }
            }

            return "log-info"; // any other level
        }
        if (stream.match(/^: /)) {
            return "comment"; // space
        }

        stream.next();
        return null;
    },
    tokenTable: {
        "log-info": logInfo,
        "log-warn": logWarn,
        "log-error": logError,
    },
};

export const log = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
