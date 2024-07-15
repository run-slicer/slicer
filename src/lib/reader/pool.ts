import type { StreamReader } from "./stream";

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

export interface Entry {
    type: ConstantType;
    index: number;
}

export interface ClassEntry extends Entry {
    type: ConstantType.Class;
    name: number;
}

export interface UTF8Entry extends Entry {
    type: ConstantType.Utf8;
    value: string;
}

export type Pool = (Entry | null)[];

export const read = async (stream: StreamReader): Promise<Pool> => {
    const size = await stream.unsignedShort();

    const pool = new Array<Entry | null>(size);
    pool.fill(null);

    for (let i = 1; i < size; i++) {
        const type = await stream.unsignedByte();
        switch (type) {
            case ConstantType.Utf8:
                pool[i] = { type, index: i, value: await stream.utf() } as UTF8Entry;
                break;
            case ConstantType.Integer:
                await stream.skip(4); // skip int
                break;
            case ConstantType.Float:
                await stream.skip(4); // skip float
                break;
            case ConstantType.Long:
                await stream.skip(8); // skip long
                i++; // longs take two constant pool entries
                break;
            case ConstantType.Double:
                await stream.skip(8); // skip double
                i++; // doubles take two constant pool entries
                break;
            case ConstantType.Class:
                pool[i] = { type, index: i, name: await stream.unsignedShort() } as ClassEntry;
                break;
            case ConstantType.String:
            case ConstantType.MethodType:
            case ConstantType.ModuleInfo:
            case ConstantType.PackageInfo:
                await stream.skip(2); // skip unsigned short
                break;
            case ConstantType.FieldRef:
            case ConstantType.MethodRef:
            case ConstantType.InterfaceMethodRef:
            case ConstantType.NameAndType:
            case ConstantType.DynamicInfo:
            case ConstantType.InvokeDynamic:
                await stream.skip(4); // skip two unsigned shorts
                break;
            case ConstantType.MethodHandle:
                await stream.skip(3); // skip unsigned byte and unsigned short
                break;
            default:
                throw new Error("Invalid constant pool tag " + type + " at position " + i);
        }
    }

    return pool;
};
