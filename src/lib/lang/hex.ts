import { LanguageSupport, StreamLanguage, type StreamParser } from "@codemirror/language";

const parser: StreamParser<any> = {
    name: "hexadecimal",
    token(stream) {
        if (stream.sol()) {
            for (let i = 0; i < 8; i++) {
                stream.next();
            }
            return "def"; // offset
        }
        if (stream.match(/^00 /)) {
            return "comment"; // zero byte
        }

        const c = stream.next();
        if (c === ".") {
            return "comment"; // zero byte in ASCII representation
        }

        return null;
    },
};

export const hex = (): LanguageSupport => {
    return new LanguageSupport(StreamLanguage.define(parser));
};
