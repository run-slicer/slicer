interface ByteStream {
    reader: ReadableStreamDefaultReader<Uint8Array>;
    buffer: Uint8Array;
    offset: number;
}

const createStream = (stream: ReadableStream<Uint8Array>): ByteStream => {
    return {
        reader: stream.getReader(),
        buffer: new Uint8Array(0),
        offset: 0,
    };
};

const skipBytes = async (stream: ByteStream, n: number) => {
    let read = 0;
    while (read < n) {
        if (stream.offset >= stream.buffer.length) {
            const { done, value } = await stream.reader.read();
            if (done || !value) {
                throw new Error("End of stream");
            }

            stream.buffer = value;
            stream.offset = 0;
        }

        const needed = Math.min(stream.buffer.length - stream.offset, n - read);

        stream.offset += needed;
        read += needed;
    }
};

const readBytes = async (stream: ByteStream, n: number): Promise<Uint8Array> => {
    const result = new Uint8Array(n);

    let read = 0;
    while (read < n) {
        if (stream.offset >= stream.buffer.length) {
            const { done, value } = await stream.reader.read();
            if (done || !value) {
                throw new Error("End of stream");
            }

            stream.buffer = value;
            stream.offset = 0;
        }

        const available = stream.buffer.length - stream.offset;
        const needed = Math.min(available, n - read);

        result.set(stream.buffer.subarray(stream.offset, stream.offset + needed), read);

        stream.offset += needed;
        read += needed;
    }

    return result;
};

const readInt = async (stream: ByteStream): Promise<number> => {
    const buffer = await readBytes(stream, 4);

    return ((buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) >>> 0;
};

const readUnsignedShort = async (stream: ByteStream): Promise<number> => {
    const buffer = await readBytes(stream, 2);

    return ((buffer[0] << 8) | buffer[1]) >>> 0;
};

const readUnsignedByte = async (stream: ByteStream): Promise<number> => {
    return (await readBytes(stream, 1))[0];
};

const readUTF = async (stream: ByteStream): Promise<string> => {
    const length = await readUnsignedShort(stream);
    const buffer = await readBytes(stream, length);

    let value = "";
    for (let i = 0; i < length; i++) {
        value += String.fromCharCode(buffer[i]);
    }

    return value;
};

export const enum ConstantType {
    Utf8 = 1,
    Integer = 3,
    Float = 4,
    Long = 5,
    Double = 6,
    Class = 7,
    String = 8,
    FieldRef = 9,
    MethodRef = 10,
    InterfaceMethodRef = 11,
    NameAndType = 12,
    MethodHandle = 15,
    MethodType = 16,
    DynamicInfo = 17,
    InvokeDynamic = 18,
    ModuleInfo = 19,
    PackageInfo = 20,
}

export type ConstantPool = Record<ConstantType, any[]>;

export const getUtf8Const = (pool: ConstantPool, i: number): string | null => {
    return (pool[ConstantType.Utf8] as string[])[i - 1] || null;
};

export const getClassConst = (pool: ConstantPool, i: number): number | null => {
    return (pool[ConstantType.Class] as number[])[i - 1] || null;
};

const readConstantPool = async (stream: ByteStream): Promise<ConstantPool> => {
    const size = await readUnsignedShort(stream);
    const utf8Pool = new Array<string>(size - 1);
    const classPool = new Array<number>(size - 1);

    for (let i = 0; i < size - 1; i++) {
        const type = await readUnsignedByte(stream);
        switch (type) {
            case ConstantType.Utf8:
                utf8Pool[i] = await readUTF(stream);
                break;
            case ConstantType.Integer:
                await skipBytes(stream, 4); // skip int
                break;
            case ConstantType.Float:
                await skipBytes(stream, 4); // skip float
                break;
            case ConstantType.Long:
                await skipBytes(stream, 8); // skip long
                i++; // longs take two constant pool entries
                break;
            case ConstantType.Double:
                await skipBytes(stream, 8); // skip double
                i++; // doubles take two constant pool entries
                break;
            case ConstantType.Class:
                classPool[i] = await readUnsignedShort(stream);
                break;
            case ConstantType.String:
            case ConstantType.MethodType:
            case ConstantType.ModuleInfo:
            case ConstantType.PackageInfo:
                await skipBytes(stream, 2); // skip unsigned short
                break;
            case ConstantType.FieldRef:
            case ConstantType.MethodRef:
            case ConstantType.InterfaceMethodRef:
            case ConstantType.NameAndType:
            case ConstantType.DynamicInfo:
            case ConstantType.InvokeDynamic:
                await skipBytes(stream, 4); // skip two unsigned shorts
                break;
            case ConstantType.MethodHandle:
                await skipBytes(stream, 3); // skip unsigned byte and unsigned short
                break;
            default:
                throw new Error("Invalid constant pool tag " + type + " at position " + i);
        }
    }

    return {
        [ConstantType.Utf8]: utf8Pool,
        [ConstantType.Integer]: [],
        [ConstantType.Float]: [],
        [ConstantType.Long]: [],
        [ConstantType.Double]: [],
        [ConstantType.Class]: classPool,
        [ConstantType.String]: [],
        [ConstantType.FieldRef]: [],
        [ConstantType.MethodRef]: [],
        [ConstantType.InterfaceMethodRef]: [],
        [ConstantType.NameAndType]: [],
        [ConstantType.MethodHandle]: [],
        [ConstantType.MethodType]: [],
        [ConstantType.DynamicInfo]: [],
        [ConstantType.InvokeDynamic]: [],
        [ConstantType.ModuleInfo]: [],
        [ConstantType.PackageInfo]: [],
    };
};

export interface Node {
    minor: number;
    major: number;
    pool: ConstantPool;
    access: number;
    this_: number;
}

export const read = async (s: ReadableStream<Uint8Array>): Promise<Node | null> => {
    const stream = createStream(s);
    try {
        const magic = await readInt(stream);
        if (magic !== 0xcafebabe) {
            return null; // invalid class file header
        }

        return {
            minor: await readUnsignedShort(stream),
            major: await readUnsignedShort(stream),
            pool: await readConstantPool(stream),
            access: await readUnsignedShort(stream),
            this_: await readUnsignedShort(stream),
        };
    } finally {
        await stream.reader.cancel();
    }
};
