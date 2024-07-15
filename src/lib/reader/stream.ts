export interface StreamReader {
    close(): Promise<void>;
    skip(n: number): Promise<void>;
    bytes(n: number): Promise<Uint8Array>;
    integer(): Promise<number>;
    unsignedShort(): Promise<number>;
    unsignedByte(): Promise<number>;
    utf(): Promise<string>;
}

interface Reader {
    stream: ReadableStreamDefaultReader<Uint8Array>;
    buffer: Uint8Array;
    offset: number;
}

const skip = async (reader: Reader, n: number) => {
    let read = 0;
    while (read < n) {
        if (reader.offset >= reader.buffer.length) {
            const { done, value } = await reader.stream.read();
            if (done || !value) {
                throw new Error("End of stream");
            }

            reader.buffer = value;
            reader.offset = 0;
        }

        const needed = Math.min(reader.buffer.length - reader.offset, n - read);

        reader.offset += needed;
        read += needed;
    }
};

const read = async (reader: Reader, n: number): Promise<Uint8Array> => {
    const result = new Uint8Array(n);

    let read = 0;
    while (read < n) {
        if (reader.offset >= reader.buffer.length) {
            const { done, value } = await reader.stream.read();
            if (done || !value) {
                throw new Error("End of stream");
            }

            reader.buffer = value;
            reader.offset = 0;
        }

        const available = reader.buffer.length - reader.offset;
        const needed = Math.min(available, n - read);

        result.set(reader.buffer.subarray(reader.offset, reader.offset + needed), read);

        reader.offset += needed;
        read += needed;
    }

    return result;
};

const readInt = async (reader: Reader): Promise<number> => {
    const buffer = await read(reader, 4);

    return ((buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) >>> 0;
};

const readUnsignedShort = async (reader: Reader): Promise<number> => {
    const buffer = await read(reader, 2);

    return ((buffer[0] << 8) | buffer[1]) >>> 0;
};

const readUnsignedByte = async (reader: Reader): Promise<number> => {
    return (await read(reader, 1))[0];
};

const readUTF = async (reader: Reader): Promise<string> => {
    const length = await readUnsignedShort(reader);
    const buffer = await read(reader, length);

    let value = "";
    for (let i = 0; i < length; i++) {
        value += String.fromCharCode(buffer[i]);
    }

    return value;
};

export const create = (s: ReadableStream<Uint8Array>): StreamReader => {
    const reader: Reader = {
        stream: s.getReader(),
        buffer: new Uint8Array(0),
        offset: 0,
    };

    return {
        close: () => reader.stream.cancel(),
        skip: (n) => skip(reader, n),
        bytes: (n) => read(reader, n),
        integer: () => readInt(reader),
        unsignedShort: () => readUnsignedShort(reader),
        unsignedByte: () => readUnsignedByte(reader),
        utf: () => readUTF(reader),
    };
};
