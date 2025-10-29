import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("./src/locale/en.json", "utf-8"));

const indent = " ".repeat(4);
let output = "// This file is auto-generated, DO NOT EDIT!\n\nexport interface LocaleData {\n";
for (const [key, value] of Object.entries(data)) {
    output += `${indent}"${key}": ${typeof value};\n`;
}
output += "}\n";

writeFileSync("./src/locale/index.ts", output);
