import type { Data } from "$lib/workspace";

const ROW_BYTES = 16;

export const formatHex = async (data: Data): Promise<string> => {
    const buffer = new Uint8Array(await data.arrayBuffer());

    let result = "";
    for (let row = 0; row < buffer.length; row += ROW_BYTES) {
        result += row.toString(16).padStart(8, "0") + "  "; // address

        // hexadecimal representation
        for (let col = 0; col < ROW_BYTES; col++) {
            if (row + col < buffer.length) {
                result += buffer[row + col].toString(16).padStart(2, "0") + " ";
            } else {
                result += "   "; // pad missing values
            }
        }
        result += " ";

        // ASCII representation
        for (let col = 0; col < ROW_BYTES; col++) {
            if (row + col < buffer.length) {
                const byte = buffer[row + col];
                result += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".";
            }
        }
        result += "\n";
    }

    return result;
};
